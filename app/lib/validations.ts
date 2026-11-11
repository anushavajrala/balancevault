import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  username: z
    .string({ error: "Username is required" })
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,50}$/, "Username must be 3–50 characters and use only letters, numbers, or underscores"),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254, "Email must be 254 characters or fewer"),
  phone: z
    .union([
      z.literal(""),
      z.string().trim().regex(/^\d{10}$/, "Phone number must contain exactly 10 digits"),
    ])
    .optional()
    .default(""),
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
  adminCode: z.string().optional().default(""),
});

export type RegisterInput = z.infer<typeof registerSchema>;
