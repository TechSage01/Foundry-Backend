import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z.string().min(3, "Community name must be at least 3 chars").max(100, "Community name cannot exceed 100 chars"),
  description: z.string().min(10, "Community description must be at least 10 chars"),
  category: z.string().min(3, "Category must be at least 3 chars").max(50, "Category cannot exceed 50 chars")
})

export const createCommunityPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 chars").max(255, "Title cannot exceed 255 chars"),
  subtitle: z.string().max(500, "Subtitle cannot exceed 500 chars").optional().nullable(),
  content: z.string().min(10, "Content must be at least 10 chars"),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
});