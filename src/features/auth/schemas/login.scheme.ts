import { z } from "zod";

export const loginSchema = z.object({
  dni: z.string().regex(/^\d{8}$/, "El DNI debe tener 8 dígitos"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type loginT = z.infer<typeof loginSchema>;
