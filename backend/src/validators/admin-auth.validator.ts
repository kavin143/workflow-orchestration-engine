import { z } from "zod";

export const adminLoginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .max(254)
      .pipe(z.email("Please provide a valid email address")),

    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
