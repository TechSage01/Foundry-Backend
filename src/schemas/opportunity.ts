import { z } from "zod";

export const createOpportunitiesSchema = z.object({
  category: z.string().min(1, "Category is required").max(50, "Category must not exceed 50 chars"),
  title: z.string().min(3, "Title must be more than 3 chars").max(255, "Title cannot exceed 255 chars"),
  description: z.string().min(10, "Description must be more than 10 chars"),
  required_skills: z.array(z.string().min(1).max(50)).default([]),
  work_arrangement: z
    .enum(["remote", "hybrid", "onsite"], {
      message: "Work arrangement must be remote, hybrid, or onsite",
    }),
  location_range: z.string().max(255, "Location cannot exceed 255 chars").optional().nullable(),
  compensation: z.string().max(255, "Compensation length cannot exceed 255 chars").optional().nullable(),
  deadline_at: z.string().datetime({ offset: true }).optional().nullable(),
  fast_apply_enabled: z.boolean().default(true),
  external_apply_url: z
    .string()
    .url("External application url must be a valid url")
    .max(500, "URL cannot exceed 500 chars")
    .optional()
    .nullable()
    .or(z.literal("")),
  screening_prompt: z.string().optional().nullable()
});

export const updateOpportunitiesSchema = z.object({
  category: z.
    string().
    min(1, "Category is required").
    max(50, "Category must not exceed 50 chars").
    optional().
    nullable(),
  title: z.
    string().
    min(3, "Title must be more than 3 chars").
    max(255, "Title cannot exceed 255 chars"). 
    optional().
    nullable(),
  description: z
    .string()
    .min(10, "Description must be more than 10 chars")
    .optional()
    .nullable(),
  required_skills: z
    .array(z.string().min(1)
    .max(50))
    .default([]),
  work_arrangement: z
    .enum(["remote", "hybrid", "onsite"], {
      message: "Work arrangement must be remote, hybrid, or onsite",
    })
    .optional()
    .nullable(),
  location_range: z.string().max(255, "Location cannot exceed 255 chars").optional().nullable(),
  compensation: z.string().max(255, "Compensation length cannot exceed 255 chars").optional().nullable(),
  deadline_at: z.string().datetime({ offset: true }).optional().nullable(),
  fast_apply_enabled: z.boolean().default(true),
  external_apply_url: z
    .url("External application url must be a valid url")
    .max(500, "URL cannot exceed 500 chars")
    .optional()
    .nullable(),
  screening_prompt: z.string().optional().nullable()
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
});