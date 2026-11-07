import { api } from "@/config/http/http-client";
import { IncidentsRepository } from "@/core/contracts/incidents.repository";
import {
  CreateIncidentRequest,
  IncidentSummary,
  IncidentDetail,
  LocalIncidentEvidence,
  IncidentAssignment,
  IncidentCreated,
  IncidentEvidence,
  IncidentHistoryItem,
  IncidentSubmitResult,
  PaginatedResult,
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

  async list(page: number) {
    const { data } = await this.http.get<
      ApiEnvelope<PaginatedResult<IncidentSummary>>
    >(this.prefix, { params: { page, limit: 20 } });
    return data;
  }

  async detail(id: string) {
    const { data } = await this.http.get<ApiEnvelope<IncidentDetail>>(
      `${this.prefix}/${id}`,
    );
    return data;
  }

  async uploadEvidence(id: string, evidence: LocalIncidentEvidence) {
    const form = new FormData();
    form.append("file", {
      uri: evidence.uri,
      name: evidence.fileName,
      type: evidence.mimeType,
    } as unknown as Blob);
    const { data } = await this.http.post<
      ApiEnvelope<
        IncidentEvidence & { incidentVersion: number; reused: boolean }
      >
    >(`${this.prefix}/${id}/evidence`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    });
    return data;
  }

  async listEvidence(incidentId: string) {
    const { data } = await this.http.get<
      ApiEnvelope<PaginatedResult<IncidentEvidence>>
    >(`${this.prefix}/${incidentId}/evidence`);
    return data;
  }

  async submit(incidentId: string, expectedVersion: number) {
    const { data } = await this.http.post<ApiEnvelope<IncidentSubmitResult>>(
      `${this.prefix}/${incidentId}/submit`,
      { expectedVersion },
    );
    return data;
  }

  async cancel(id: string, expectedVersion: number, reason: string) {
    const { data } = await this.http.post<ApiEnvelope<IncidentDetail>>(
      `${this.prefix}/${id}/cancel`,
      { expectedVersion, reason },
    );
    return data;
  }

  async history(incidentId: string) {
    const { data } = await this.http.get<
      ApiEnvelope<PaginatedResult<IncidentHistoryItem>>
    >(`${this.prefix}/${incidentId}/history`, {
      params: { page: 1, limit: 20 },
    });
    return data;
  }

  async assignments(incidentId: string) {
    const { data } = await this.http.get<
      ApiEnvelope<PaginatedResult<IncidentAssignment>>
    >(`${this.prefix}/${incidentId}/assignments`, {
      params: { page: 1, limit: 20 },
    });
    return data;
  }
}

export const incidentsService = new IncidentsService();
