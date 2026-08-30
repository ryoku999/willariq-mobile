import { z } from "zod";

export const loginSchema = z.object({
  dni: z.string(),
  password: z.string(),
});

export type loginT = z.infer<typeof loginSchema>;
