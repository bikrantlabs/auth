import { z } from "zod";

/** HTTP contract for POST /auth/register. Length checks mirror PlainPassword. */
export const registerSchema = z.object({
  email: z.email().trim().toLowerCase().min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot be greater than 128 characters"),
});

export type RegisterBody = z.infer<typeof registerSchema>;
