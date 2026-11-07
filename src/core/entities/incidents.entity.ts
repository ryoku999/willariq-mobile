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
  version: number;
  id: string;
  trackingCode: string;
  clientRequestId: string;
  status: IncidentStatus;
  createdAt: string;
}

export interface IncidentSummary {
  id: string;
  trackingCode: string;
  version: number;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  address: string | null;
  createdAt: string;
}

export interface IncidentDetail extends IncidentSummary {
  originalMessage: string;
  submittedAt: string | null;
}

export interface IncidentEvidence {
  id: string;

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
  area?: { name: string; code: string } | null;
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
  trackingCode: string;
  status: IncidentStatus;
  version: number;
  jobId: string | null;
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
