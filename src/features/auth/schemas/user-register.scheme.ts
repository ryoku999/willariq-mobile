import { z } from "zod";
import { loginSchema } from "./login.scheme";

export const userCreateReqSchema = loginSchema.refine(
  ({ dni, password }) => Boolean(password.trim()) && password.trim() !== dni,
  {
    path: ["password"],
    message: "Elige una contraseña distinta de tu DNI",
  },
);

export type UserCreateReqT = z.infer<typeof userCreateReqSchema>;
