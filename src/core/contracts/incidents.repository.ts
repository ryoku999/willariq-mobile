import {
  CreateIncidentRequest,
  IncidentAssignment,
  IncidentCreated,
  IncidentDetail,
  IncidentEvidence,
  IncidentHistoryItem,
  IncidentSubmitResult,
  IncidentSummary,
  LocalIncidentEvidence,
  PaginatedResult,
} from "@/core/entities/incidents.entity";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";

export interface IncidentsRepository {
  create(request: CreateIncidentRequest): Promise<ApiEnvelope<IncidentCreated>>;

  list(page: number): Promise<ApiEnvelope<PaginatedResult<IncidentSummary>>>;

  detail(id: string): Promise<ApiEnvelope<IncidentDetail>>;

  uploadEvidence(
    id: string,
    evidence: LocalIncidentEvidence,
  ): Promise<
    ApiEnvelope<IncidentEvidence & { incidentVersion: number; reused: boolean }>
  >;

  listEvidence(
    incidentId: string,
  ): Promise<ApiEnvelope<PaginatedResult<IncidentEvidence>>>;

  submit(
    incidentId: string,
    expectedVersion: number,
  ): Promise<ApiEnvelope<IncidentSubmitResult>>;

  cancel(
    id: string,
    expectedVersion: number,
    reason: string,
  ): Promise<ApiEnvelope<IncidentDetail>>;

  history(
    incidentId: string,
  ): Promise<ApiEnvelope<PaginatedResult<IncidentHistoryItem>>>;

  assignments(
    incidentId: string,
  ): Promise<ApiEnvelope<PaginatedResult<IncidentAssignment>>>;
}
