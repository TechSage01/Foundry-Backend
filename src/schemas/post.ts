import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 chars").max(255, "Title cannot exceed 255 chars"),
  subtitle: z.string().max(500, "Subtitle cannot exceed 500 chars").optional().nullable(),
  content: z.string().min(10, "Content must be at least 10 chars"),
  tags: z.array(z.string()).optional().default([]),
  is_published: z.boolean().optional().default(true)
});

export const createCommentSchema = z.object({
  parent_id: z.string().optional().nullable(),
  content: z.string().min(1, "Content must be at least 1 chars")
})

export const updatePostSchema = createPostSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });