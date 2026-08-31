import { api } from "@/config/http/http-client";
import { ChatRepository } from "@/core/contracts/chat.repository";
import {
  ChatJob,
  ChatMessage,
  ChatPage,
  ChatRole,
  ChatSession,
  CreateChatSessionRequest,
  SendChatMessageRequest,
  SendChatMessageResult,
} from "@/core/entities/chat.entity";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import { AxiosInstance } from "axios";

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeRole(value: unknown): ChatRole {
  const role = asString(value);
  return role === "ASSISTANT" || role === "SYSTEM" ? role : "USER";
}

function normalizeSources(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const source = asRecord(item);
    return {
      documentId: asString(source.documentId) || asString(source.id),
      title: asString(source.title) || "Documento municipal",
    };
  });
}

function normalizeMessage(value: unknown): ChatMessage {
  const source = asRecord(value);
  const metadata = asRecord(source.metadata);
  return {
    id: asString(source.id),
    sessionId: asString(source.sessionId),
    role: normalizeRole(source.role),
    content: asString(source.content),
    metadata: Object.keys(metadata).length
      ? {
          responseType: asString(metadata.responseType) || undefined,
          sources: normalizeSources(metadata.sources),
        }
      : null,
    createdAt: asString(source.createdAt),
  };
}

function normalizeSession(value: unknown): ChatSession {
  const source = asRecord(value);
  return {
    id: asString(source.id),
    title: asString(source.title) || "Consulta municipal",
    status: asString(source.status) || "ACTIVE",
    createdAt: asString(source.createdAt),
    updatedAt: asString(source.updatedAt) || asString(source.createdAt),
    closedAt: typeof source.closedAt === "string" ? source.closedAt : null,
  };
}

function normalizePage<T>(
  value: unknown,
  normalizeItem: (item: unknown) => T,
): ChatPage<T> {
  if (Array.isArray(value)) {
    return {
      items: value.map(normalizeItem),
      pagination: { page: 1, limit: 20, total: value.length, pages: 1 },
    };
  }

  const source = asRecord(value);
  const items = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.data)
      ? source.data
      : [];
  const pagination = asRecord(source.pagination);
  const page = Number(pagination.page ?? source.page) || 1;
  const limit = Number(pagination.limit ?? source.limit) || 20;
  const total = Number(pagination.total ?? source.total) || items.length;

  return {
    items: items.map(normalizeItem),
    pagination: {
      page,
      limit,
      total,
      pages:
        Number(pagination.pages ?? source.pages) ||
        Math.max(1, Math.ceil(total / limit)),
    },
  };
}

function normalizeSendResult(value: unknown): SendChatMessageResult {
  const source = asRecord(value);
  return {
    userMessageId: asString(source.userMessageId),
    assistantMessage: source.assistantMessage
      ? normalizeMessage(source.assistantMessage)
      : null,
    aiJobId: typeof source.aiJobId === "string" ? source.aiJobId : null,
  };
}

class ChatService implements ChatRepository {
  private readonly prefix = "/chat";
  private readonly http: AxiosInstance = api;

  async createSession(request: CreateChatSessionRequest) {
    const { data } = await this.http.post<ApiEnvelope<unknown>>(
      `${this.prefix}/sessions`,
      request,
    );
    return { ...data, data: normalizeSession(data.data) };
  }

  async listSessions(page: number) {
    const { data } = await this.http.get<ApiEnvelope<unknown>>(
      `${this.prefix}/sessions`,
      { params: { page, limit: 20 } },
    );
    return { ...data, data: normalizePage(data.data, normalizeSession) };
  }

  async getSession(id: string) {
    const { data } = await this.http.get<ApiEnvelope<unknown>>(
      `${this.prefix}/sessions/${id}`,
    );
    return { ...data, data: normalizeSession(data.data) };
  }

  async listMessages(sessionId: string, page: number) {
    const { data } = await this.http.get<ApiEnvelope<unknown>>(
      `${this.prefix}/sessions/${sessionId}/messages`,
      { params: { page, limit: 50 } },
    );
    return { ...data, data: normalizePage(data.data, normalizeMessage) };
  }

  async sendMessage(request: SendChatMessageRequest) {
    const { sessionId, ...body } = request;
    const { data } = await this.http.post<ApiEnvelope<unknown>>(
      `${this.prefix}/sessions/${sessionId}/messages`,
      body,
    );
    return { ...data, data: normalizeSendResult(data.data) };
  }

  async getJob(id: string) {
    const { data } = await this.http.get<ApiEnvelope<unknown>>(
      `${this.prefix}/jobs/${id}`,
    );
    const source = asRecord(data.data);
    return {
      ...data,
      data: {
        id: asString(source.id),
        status: asString(source.status),
        provider: typeof source.provider === "string" ? source.provider : null,
        sources: normalizeSources(source.sources),
      } satisfies ChatJob,
    };
  }

  async closeSession(id: string) {
    await this.http.post(`${this.prefix}/sessions/${id}/close`);
  }
}

export const chatService = new ChatService();
