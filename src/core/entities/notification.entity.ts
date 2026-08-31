export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";

export type NotificationType =
  | "INCIDENT_CREATED"
  | "INCIDENT_STATUS_CHANGED"
  | "INCIDENT_ASSIGNED"
  | "INCIDENT_RESOLVED"
  | "INCIDENT_REJECTED"
  | "AI_REVIEW_REQUIRED"
  | "GENERAL";

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsPage {
  items: AppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
