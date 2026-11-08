import {
  NotificationFilters,
  NotificationsPage,
} from "@/core/entities/notification.entity";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";

export interface NotificationsRepository {
  list(
    page: number,
    filters?: NotificationFilters,
  ): Promise<ApiEnvelope<NotificationsPage>>;
  unreadCount(): Promise<ApiEnvelope<{ count: number }>>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}
