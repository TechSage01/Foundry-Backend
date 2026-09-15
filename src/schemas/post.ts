import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 chars").max(255, "Title cannot exceed 255 chars"),
  subtitle: z.string().max(500, "Subtitle cannot exceed 500 chars").optional().nullable(),
  content: z.string().min(10, "Content must be at least 10 chars"),
  cover_image_url: z.string().url("Invalid Image Url").optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  is_published: z.boolean().optional().default(false)
});

export const updatePostSchema = createPostSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });