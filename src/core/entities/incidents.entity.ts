export type IncidentStatus =
  | "RECEIVED"
  | "AI_ANALYSIS"
  | "IN_REVIEW"
  | "ACCEPTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "CLOSED"
  | "CANCELLED";

export interface CreateIncidentRequest {
  clientRequestId: string;
  originalMessage: string;
  latitude: number;
  longitude: number;
  address?: string;
  addressReference?: string;
}

export interface IncidentCreated {
  id: string;
  trackingCode: string;
  clientRequestId: string;
  status: IncidentStatus;
  createdAt: string;
}

export interface EvidenceUploadRequest {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  capturedAt?: string;
}

export interface PresignedEvidenceUpload {
  uploadId: string;
  method: "POST";
  url: string;
  fields: Record<string, string>;
  expiresAt: string;
  maxSizeBytes: number;
}

export interface IncidentEvidence {
  id: string;
  uploadId?: string;
  fileName?: string;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  capturedAt?: string | null;
  createdAt?: string;
}

export interface IncidentHistoryItem {
  id: string;
  previousStatus: IncidentStatus | null;
  newStatus: IncidentStatus;
  createdAt: string;
}

export interface IncidentAssignment {
  id: string;
  status: string;
  areaName?: string;
  assigneeName?: string;
  createdAt?: string;
  assignedAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface IncidentSubmitResult {
  incidentId: string;
  aiJob: {
    id: string;
    status: string;
    createdAt: string;
  };
}

export type EvidenceUploadStatus =
  "queued" | "preparing" | "uploading" | "uploaded" | "confirmed" | "error";

export interface LocalIncidentEvidence {
  localId: string;
  uri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  capturedAt?: string;
  uploadId?: string;
  status: EvidenceUploadStatus;
  error?: string;
}

export interface IncidentDraft {
  clientRequestId: string;
  originalMessage: string;
  address: string;
  addressReference: string;
  latitude: number | null;
  longitude: number | null;
  evidences: LocalIncidentEvidence[];
  serverIncident: IncidentCreated | null;
}

export interface LocalIncidentRecord {
  id: string;
  trackingCode: string;
  clientRequestId: string;
  originalMessage: string;
  address: string;
  addressReference: string;
  latitude: number;
  longitude: number;
  status: IncidentStatus;
  createdAt: string;
  submittedAt: string;
  evidences: LocalIncidentEvidence[];
}
