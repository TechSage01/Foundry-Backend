import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(2, "Title must be at least 3 characters").max(100, "Title max 100 chars"),
  tagline: z.string().min(5, "Tagline must be at least 5 chars").max(200, "Tagline max 200 chars"),
  description: z.string().optional().nullable(),
  cover_image_url: z.string().url("Must be a valid url").optional().nullable(),
  demo_url: z.string().url("Must be a valid url").or(z.literal("")).optional().nullable(),
  github_url: z.string().url("Must be a valid url").or(z.literal("")).optional().nullable(),
  tech_stack: z.array(z.string()).default([]),
  is_published: z.boolean().default(true),
});

export const updateProjectSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  tagline: z.string().min(5).max(200).optional(),
  description: z.string().optional().nullable(),
  cover_image_url: z.string().url().optional().nullable(),
  demo_url: z.string().url().optional().nullable(),
  github_url: z.string().url().optional().nullable(),
  tech_stack: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
});
