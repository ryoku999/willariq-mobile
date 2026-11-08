import type { IncidentStatus } from "@/core/entities/incidents.entity";

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  RECEIVED: "Recibida",
  AI_ANALYSIS: "En análisis",
  IN_REVIEW: "En revisión",
  ACCEPTED: "Aceptada",
  ASSIGNED: "Asignada",
  IN_PROGRESS: "En atención",
  RESOLVED: "Resuelta",
  REJECTED: "Rechazada",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
};
