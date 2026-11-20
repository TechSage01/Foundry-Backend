import { z } from "zod";

export const emailSchema = z.object({
  email: z.email()
})

export const otpSchema = z.object({
  email: z.email(),
  code: z.string()
})