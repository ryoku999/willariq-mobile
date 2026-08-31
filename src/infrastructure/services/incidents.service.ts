import { api } from "@/config/http/http-client";
import { IncidentsRepository } from "@/core/contracts/incidents.repository";
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
import { AxiosInstance } from "axios";

class IncidentsService implements IncidentsRepository {
  private readonly prefix = "/incidents";
  private readonly http: AxiosInstance = api;

  async create(request: CreateIncidentRequest) {
    const { data } = await this.http.post<ApiEnvelope<IncidentCreated>>(
      this.prefix,
      request,
    );
    return data;
  }

  async requestEvidenceUpload(
    incidentId: string,
    request: EvidenceUploadRequest,
  ) {
    const { data } = await this.http.post<ApiEnvelope<PresignedEvidenceUpload>>(
      `${this.prefix}/${incidentId}/evidence/presigned-upload`,
      request,
    );
    return data;
  }

  async confirmEvidence(incidentId: string, uploadId: string) {
    const { data } = await this.http.post<ApiEnvelope<IncidentEvidence>>(
      `${this.prefix}/${incidentId}/evidence`,
      { uploadId },
    );
    return data;
  }

  async listEvidence(incidentId: string) {
    const { data } = await this.http.get<ApiEnvelope<IncidentEvidence[]>>(
      `${this.prefix}/${incidentId}/evidence`,
    );
    return data;
  }

  async submit(incidentId: string) {
    const { data } = await this.http.post<ApiEnvelope<IncidentSubmitResult>>(
      `${this.prefix}/${incidentId}/submit`,
    );
    return data;
  }

  async history(incidentId: string) {
    const { data } = await this.http.get<
      ApiEnvelope<PaginatedResult<IncidentHistoryItem>>
    >(`${this.prefix}/${incidentId}/history`, {
      params: { page: 1, limit: 20, order: "asc" },
    });
    return data;
  }

  async assignments(incidentId: string) {
    const { data } = await this.http.get<
      ApiEnvelope<PaginatedResult<IncidentAssignment>>
    >(`${this.prefix}/${incidentId}/assignments`, {
      params: { page: 1, limit: 20, order: "desc" },
    });
    return data;
  }
}

export const incidentsService = new IncidentsService();
