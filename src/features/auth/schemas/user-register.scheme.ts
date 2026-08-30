import { z } from "zod";

export const userCreateReqSchema = z.object({
  firstName: z.string().trim().min(1, "Ingresa tu nombre"),
  dni: z.string().regex(/^\d{8}$/, "El DNI debe tener 8 dígitos"),
  phone: z.string().regex(/^\d{9}$/, "El teléfono debe tener 9 dígitos"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  lastName: z.string().trim().nullable(),
});

export type UserCreateReqT = z.infer<typeof userCreateReqSchema>;
