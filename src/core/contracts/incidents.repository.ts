import {
  CreateIncidentRequest,
  EvidenceUploadRequest,
  IncidentAssignment,
  IncidentCreated,
  IncidentEvidence,
  IncidentHistoryItem,
  IncidentSubmitResult,
  PaginatedResult,
  PresignedEvidenceUpload,
} from "@/core/entities/incidents.entity";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";

export interface IncidentsRepository {
  create(request: CreateIncidentRequest): Promise<ApiEnvelope<IncidentCreated>>;
  requestEvidenceUpload(
    incidentId: string,
    request: EvidenceUploadRequest,
  ): Promise<ApiEnvelope<PresignedEvidenceUpload>>;
  confirmEvidence(
    incidentId: string,
    uploadId: string,
  ): Promise<ApiEnvelope<IncidentEvidence>>;
  listEvidence(incidentId: string): Promise<ApiEnvelope<IncidentEvidence[]>>;
  submit(incidentId: string): Promise<ApiEnvelope<IncidentSubmitResult>>;
  history(
    incidentId: string,
  ): Promise<ApiEnvelope<PaginatedResult<IncidentHistoryItem>>>;
  assignments(
    incidentId: string,
  ): Promise<ApiEnvelope<PaginatedResult<IncidentAssignment>>>;
}
