import { z } from "zod";

export const sendMessageSchema = z.object({
  conversation_id: z.uuid().optional(),
  recipent_id: z.uuid().optional(),
  content: z.string().trim()
}).refine((data) => data.conversation_id || data.recipent_id, {
  message: "Either conversation_id or recipent_id must be provided",
  path: ["conversation_id"],
});