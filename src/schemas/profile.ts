import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").max(30, "Username cannot exceed 30 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional(),
  full_name: z.string().min(3, "Full name must be at least 3 chars long").max(50, "Full name must not exceed 50 chars").optional(),
  headline: z.string().max(100, "Headline cannot exceed 100 characters").optional().nullable(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().nullable(),
  location: z.string().max(50, "Location cannot exceed 50 characters").optional().nullable(),
  avatar_url: z.string().url("Invalid Url").optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  external_links: z.record(
    z.string(), 
    z.string().url("Must be a valid url").or(z.literal(""))
  ).optional().nullable()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;