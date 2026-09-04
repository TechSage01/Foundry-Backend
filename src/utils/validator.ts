import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").max(30, "Username cannot exceed 30 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional(),
  headline: z.string().max(100, "Headline cannot exceed 100 characters").optional().nullable(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().nullable(),
  location: z.string().max(50, "Location cannot exceed 50 characters").optional().nullable(),

  skills: z.array(z.string()).optional().nullable(),
  external_links: z.record(z.string(), z.string()).optional().nullable()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;