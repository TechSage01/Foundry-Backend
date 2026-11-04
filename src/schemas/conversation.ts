import { z } from "zod";

export const sendMessageSchema = z.object({
  conversation_id: z.uuid().optional(),
  recipent_id: z.uuid().optional(),
  content: z.string().trim()
}).refine((data) => data.conversation_id || data.recipent_id, {
  message: "Either conversation_id or recipent_id must be provided",
  path: ["conversation_id"],
});

export const getConversationsQuerySchema = z.object({
  type: z.enum(["direct", "group", "project"]).optional(),
})

export const getMessagesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 30)
    .pipe(z.number().min(1).max(100)),
  cursor: z.string().datetime().optional()
})