import { z } from "zod";

// Define the shape of your expected body payload
export const registerUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    email: z.string().email("Invalid email format"),
    age: z.number().int().positive().optional(),
    role: z.enum(["admin", "user"]).default("user"),
  }),
});

// Automatically extract TypeScript types from the schema
export type RegisterUserRequest = z.infer<typeof registerUserSchema>;
export type RegisterUserBody = z.infer<typeof registerUserSchema>["body"];
