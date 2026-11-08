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

  async listEvidence(incidentId: string, page = 1) {
    const { data } = await this.http.get<
      ApiEnvelope<PaginatedResult<IncidentEvidence>>
    >(`${this.prefix}/${incidentId}/evidence`, { params: { page, limit: 20 } });
    return data;
  }

  async evidenceImage(
    incidentId: string,
    evidenceId: string,
    signal?: AbortSignal,
  ) {
    const response = await this.http.get<ArrayBuffer>(
      `${this.prefix}/${incidentId}/evidence/${evidenceId}/content`,
      { responseType: "arraybuffer", signal },
    );
    const mime = String(response.headers["content-type"] ?? "").split(";")[0];
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
      throw new Error("Formato de imagen no disponible.");
    }
    const bytes = new Uint8Array(response.data);
    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let encoded = "";
    for (let index = 0; index < bytes.length; index += 3) {
      const first = bytes[index];
      const second = bytes[index + 1] ?? 0;
      const third = bytes[index + 2] ?? 0;
      encoded +=
        alphabet[first >> 2] + alphabet[((first & 3) << 4) | (second >> 4)];
      encoded +=
        index + 1 < bytes.length
          ? alphabet[((second & 15) << 2) | (third >> 6)]
          : "=";
      encoded += index + 2 < bytes.length ? alphabet[third & 63] : "=";
    }
    return `data:${mime};base64,${encoded}`;
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

  async history(incidentId: string, page = 1) {
    const { data } = await this.http.get<
      ApiEnvelope<PaginatedResult<IncidentHistoryItem>>
    >(`${this.prefix}/${incidentId}/history`, {
      params: { page, limit: 20 },
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
