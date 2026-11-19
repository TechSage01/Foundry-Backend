import pool from "../config/db.js";
import { shortenSm } from "../utils/helpers.js";
import { AddNotification } from "./notification.js";


const MESSAGE_MENTION_REGEX =
  /(?:^|\s)@([a-zA-Z0-9_-]{2,40})(?=$|\s|[.,!?;:'")\]}])/g;

interface NotifyMentionsParams {
  id: string,
  conversation_id: string,
  sender_id: string,
  content: string | null
}

export const notifyMentions = async (message: NotifyMentionsParams) => {
  if (!message.content) return;

  // extract @handles
  const handles = new Set<string>()
  for (const match of message.content.matchAll(MESSAGE_MENTION_REGEX)) {
    handles.add(match[1].toLowerCase())
  };

  if (handles.size === 0) return;

  const candidateHandles = Array.from(handles).slice(0, 10);

  const [memberRes, contextRes] = await Promise.all([
    pool.query<{ user_id: string }>(`
      SELECT p.user_id
      FROM profiles p
      JOIN conversation_members cm
        ON cm.user_id = p.user_id
      AND cm.conversation_id = $1
      WHERE LOWER(p.username) = ANY($2::TEXT[])
        AND p.user_id != $3
    `, [message.conversation_id, candidateHandles, message.sender_id]
    ),
    pool.query<{
      conversation_name: string | null,
      actor_name: string,
      actor_username: string,
      actor_avatar: string | null
    }>(`
      SELECT
        c.name as conversation_name,
        prof.full_name as actor_name,
        prof.username as actor_username,
        prof.avatar_url as actor_avatar
      FROM conversations c
      JOIN profiles prof ON prof.user_id = $2
      WHERE c.id = $1
    `, [message.conversation_id, message.sender_id]
    )
  ]);

  const info = contextRes.rows[0];
  if (!info || memberRes.rows.length === 0) return;

  await Promise.all(
    memberRes.rows.map((member) => {
      AddNotification({
        recipentId: member.user_id,
        actorId: message.sender_id,
        entityType: "message_mention",
        entityId: message.id,
        metadata: {
          conversation_name: info.conversation_name,
          snippet: shortenSm(message.content!),
          full_name: info.actor_name,
          user_name: info.actor_username,
          avatar_url:  info.actor_avatar
        }
      });
    })
  );
}