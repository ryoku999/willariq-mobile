import { api } from "@/config/http/http-client";
import { NotificationsRepository } from "@/core/contracts/notifications.repository";
import {
  AppNotification,
  NotificationFilters,
  NotificationStatus,
  NotificationType,
  NotificationsPage,
} from "@/core/entities/notification.entity";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import { AxiosInstance } from "axios";

const NOTIFICATION_TYPES: NotificationType[] = [
  "INCIDENT_CREATED",
  "INCIDENT_STATUS_CHANGED",
  "INCIDENT_ASSIGNED",
  "INCIDENT_RESOLVED",
  "INCIDENT_REJECTED",
  "AI_REVIEW_REQUIRED",
  "GENERAL",
];

const NOTIFICATION_STATUSES: NotificationStatus[] = [
  "PENDING",
  "SENT",
  "FAILED",
  "READ",
];

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeNotification(value: unknown): AppNotification {
  if (!value || typeof value !== "object") {
    throw new Error("NOTIFICATION_RESPONSE_INVALID");
  }

  const source = value as Record<string, unknown>;
  const type = asString(source.type) as NotificationType;
  const status = asString(source.status) as NotificationStatus;
  const metadata =
    source.metadata && typeof source.metadata === "object"
      ? (source.metadata as Record<string, unknown>)
      : null;

  return {
    id: asString(source.id),
    type: NOTIFICATION_TYPES.includes(type) ? type : "GENERAL",
    status: NOTIFICATION_STATUSES.includes(status) ? status : "SENT",
    // The backend DTO may expose message, body, or content. Normalize it here.
    title: asString(source.title),
    message:
      asString(source.message) ||
      asString(source.body) ||
      asString(source.content),
    metadata,
    createdAt: asString(source.createdAt),
    readAt: typeof source.readAt === "string" ? source.readAt : null,
  };
}

function normalizePage(value: unknown): NotificationsPage {
  if (Array.isArray(value)) {
    return {
      items: value.map(normalizeNotification),
      pagination: { page: 1, limit: 20, total: value.length, pages: 1 },
    };
  }

  if (!value || typeof value !== "object") {
    throw new Error("NOTIFICATIONS_RESPONSE_INVALID");
  }

  const source = value as Record<string, unknown>;
  const pagination =
    source.pagination && typeof source.pagination === "object"
      ? (source.pagination as Record<string, unknown>)
      : source;
  if (!Array.isArray(source.items)) {
    throw new Error("NOTIFICATIONS_RESPONSE_INVALID");
  }

  const items = source.items;
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 20;
  const total = Number(pagination.total) || items.length;

  return {
    items: items.map(normalizeNotification),
    pagination: {
      page,
      limit,
      total,
      pages: Number(pagination.pages) || Math.max(1, Math.ceil(total / limit)),
    },
  };
}

class NotificationsService implements NotificationsRepository {
  private readonly prefix = "/notifications";
  private readonly http: AxiosInstance = api;

  async list(page: number, filters?: NotificationFilters) {
    const { data } = await this.http.get<ApiEnvelope<unknown>>(this.prefix, {
      params: { page, limit: 20, order: "desc", ...filters },
    });
    return { ...data, data: normalizePage(data.data) };
  }

  async unreadCount() {
    const { data } = await this.http.get<ApiEnvelope<{ count: number }>>(
      `${this.prefix}/unread-count`,
    );
    return data;
  }

  async markRead(id: string) {
    await this.http.patch(`${this.prefix}/${id}/read`);
  }

  async markAllRead() {
    await this.http.post(`${this.prefix}/read-all`);
  }
}

export const notificationsService = new NotificationsService();
