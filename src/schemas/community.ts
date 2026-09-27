import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z.string().min(3, "Community name must be at least 3 chars").max(100, "Community name cannot exceed 100 chars"),
  description: z.string().min(10, "Community description must be at least 10 chars"),
  category: z.string().min(3, "Category must be at least 3 chars").max(50, "Category cannot exceed 50 chars")
})