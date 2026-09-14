import { z } from "zod";

export const createExperienceSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(100),
  company_url: z.string().url("Invalid URL").optional().nullable(),
  role: z.string().min(1, "Role is required").max(100),
  location: z.string().max(100).optional().nullable(),
  employment_type: z
    .enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'])
    .optional()
    .nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional().nullable(),
  is_current: z.boolean().default(false),
  description: z.string().optional().nullable(),
  technologies: z.array(z.string()).default([])
})

export const updateExperienceSchema = 
  z.object({
    company_name: z.string().min(1).max(100).optional(),
    company_url: z.string().url().optional().nullable(),
    role: z.string().min(1).max(100).optional(),
    location: z.string().max(100).optional().nullable(),
    employment_type: z
      .enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'])
      .optional()
      .nullable(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    is_current: z.boolean().optional(),
    description: z.string().optional().nullable(),
    technologies: z.array(z.string()).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided to update",
  });