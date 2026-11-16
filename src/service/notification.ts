import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export interface NotificationPayload {
  recipentId: string,
  actorId: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, any>
}

export const AddNotification = (payload: NotificationPayload) => {
  const notificationId = uuidv4();

  pool.query(`
    INSERT INTO notifications
      (id, recipent_id, actor_id, entity_type, entity_id, metadata)
    SELECT $1::UUID, $2::UUID, $3::UUID, $4::VARCHAR, $5::UUID, $6::JSONB
    WHERE $2::UUID != $3::UUID
      AND NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE recipent_id = $2::UUID
          AND actor_id = $3::UUID
          AND entity_type = $4::VARCHAR
          AND entity_id IS NOT DISTINCT FROM $5::UUID
          AND created_at > NOW() - INTERVAL '24 hours'
      )
  `, [
    notificationId,
    payload.recipentId,
    payload.actorId,
    payload.entityType,
    payload.entityId ?? null,
    payload.metadata
  ])
}