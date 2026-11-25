import { z } from "zod";

export const incidentSchema = z.object({
  originalMessage: z
    .string()
    .trim()
    .min(5, "Describe la incidencia con al menos 5 caracteres")
    .max(5000, "La descripción no puede superar 5000 caracteres"),
  address: z
    .string()
    .trim()
    .max(300, "La dirección no puede superar 300 caracteres"),
  addressReference: z
    .string()
    .trim()
    .max(1000, "La referencia no puede superar 1000 caracteres"),
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;
