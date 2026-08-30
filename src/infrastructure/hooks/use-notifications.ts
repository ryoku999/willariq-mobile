import { queryClient } from "@/config/query/query-client";
import { NotificationFilters } from "@/core/entities/notification.entity";
import { notificationsService } from "@/infrastructure/services/notifications.service";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

export const notificationKeys = {
  list: (filters: NotificationFilters) => ["notifications", filters] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export function useNotifications(filters: NotificationFilters = {}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => notificationsService.list(pageParam, filters),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
  });
}

export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationsService.unreadCount(),
    enabled,
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
