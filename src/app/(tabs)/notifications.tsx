import type {
  AppNotification,
  NotificationType,
} from "@/core/entities/notification.entity";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotifications,
} from "@/infrastructure/hooks/use-notifications";
import ErrorState from "@/presentation/components/ErrorState";
import PendingState from "@/presentation/components/PendingState";
import { formatDate } from "@/shared/utils/format-date";
import {
  BottomSheet,
  Button,
  Column,
  ScrollView as ExpoScrollView,
  Text as ExpoText,
  Host,
} from "@expo/ui";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  useColorScheme,
  View,
} from "react-native";

const NOTIFICATION_COPY: Record<
  NotificationType,
  { label: string; fallback: string; icon: keyof typeof Feather.glyphMap }
> = {
  INCIDENT_CREATED: {
    label: "Incidencia registrada",
    fallback: "Tu incidencia fue registrada correctamente.",
    icon: "clipboard",
  },
  INCIDENT_STATUS_CHANGED: {
    label: "Estado actualizado",
    fallback: "El estado de una incidencia cambió.",
    icon: "refresh-cw",
  },
  INCIDENT_ASSIGNED: {
    label: "Incidencia asignada",
    fallback: "Un área municipal fue asignada a tu incidencia.",
    icon: "users",
  },
  INCIDENT_RESOLVED: {
    label: "Incidencia resuelta",
    fallback: "Tu incidencia fue marcada como resuelta.",
    icon: "check-circle",
  },
  INCIDENT_REJECTED: {
    label: "Incidencia rechazada",
    fallback: "Tu incidencia no pudo continuar su atención.",
    icon: "x-circle",
  },
  AI_REVIEW_REQUIRED: {
    label: "Revisión requerida",
    fallback: "Tu incidencia requiere una revisión adicional.",
    icon: "alert-circle",
  },
  GENERAL: {
    label: "Actualización municipal",
    fallback: "Tienes una nueva notificación.",
    icon: "bell",
  },
};

const NotificationsPage = () => {
  const isDark = useColorScheme() === "dark";
  const notifications = useNotifications();
  const unread = useUnreadNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  const items =
    notifications.data?.pages.flatMap((page) => page.data.items) ?? [];
  const unreadCount = unread.data?.data.count ?? 0;

  const refresh = useCallback(async () => {
    await Promise.all([notifications.refetch(), unread.refetch()]);
  }, [notifications.refetch, unread.refetch]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const openNotification = (notification: AppNotification) => {
    setSelected(notification);
    if (notification.status !== "READ") markRead.mutate(notification.id);
  };

  const loadNextPage = () => {
    if (notifications.hasNextPage && !notifications.isFetchingNextPage) {
      void notifications.fetchNextPage();
    }
  };

  const refreshControl = (
    <RefreshControl
      refreshing={
        notifications.isRefetching && !notifications.isFetchingNextPage
      }
      onRefresh={() => void refresh()}
      tintColor={isDark ? "#93c5fd" : "#2563eb"}
    />
  );

  if (notifications.isLoading) {
    return (
      <View className="pt-safe flex-1 bg-gray-50 dark:bg-gray-950">
        <PendingState message="Cargando notificaciones..." />
      </View>
    );
  }

  if (notifications.isError && items.length === 0) {
    return (
      <View className="pt-safe flex-1 bg-gray-50 dark:bg-gray-950">
        <ErrorState
          title="No pudimos cargar las notificaciones"
          onRetry={() => void refresh()}
          isRetrying={notifications.isRefetching}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="pt-safe bg-blue-600 px-5 pb-6 dark:bg-blue-950">
        <View className="mt-5 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-xs font-semibold tracking-widest text-blue-100">
              CENTRO DE ACTIVIDAD
            </Text>
            <Text className="mt-2 text-3xl font-bold text-white">
              Notificaciones
            </Text>
            <Text className="mt-1 text-blue-100">
              {unreadCount > 0 ? `${unreadCount} sin leer` : "Estás al día"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar notificaciones"
            onPress={() => void refresh()}
            disabled={notifications.isRefetching}
            className="h-11 w-11 items-center justify-center rounded-full bg-blue-500 disabled:opacity-50 dark:bg-blue-900"
          >
            {notifications.isRefetching ? (
              <ActivityIndicator color="white" />
            ) : (
              <Feather name="refresh-cw" size={20} color="white" />
            )}
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Marcar todas las notificaciones como leídas"
          onPress={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
          className="mt-5 min-h-11 flex-row items-center gap-2 self-start rounded-xl bg-white/15 px-4 disabled:opacity-40"
        >
          {markAllRead.isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Feather name="check-circle" size={16} color="white" />
          )}
          <Text className="font-semibold text-white">
            Marcar todas como leídas
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={refreshControl}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
        renderItem={({ item }) => (
          <NotificationRow item={item} onPress={openNotification} />
        )}
        onScrollBeginDrag={() => setHasUserScrolled(true)}
        onEndReached={() => {
          if (hasUserScrolled) loadNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          notifications.isFetchingNextPage ? (
            <ActivityIndicator color="#2563eb" className="my-4" />
          ) : notifications.isFetchNextPageError ? (
            <Pressable
              onPress={loadNextPage}
              className="my-4 items-center justify-center rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-950"
            >
              <Text className="font-semibold text-blue-700 dark:text-blue-300">
                Reintentar cargar más notificaciones
              </Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
              <Feather name="bell-off" size={28} color="#2563eb" />
            </View>
            <Text className="mt-5 text-center text-xl font-bold text-gray-900 dark:text-white">
              No tienes notificaciones
            </Text>
            <Text className="mt-2 text-center leading-5 text-gray-500 dark:text-gray-400">
              Las actualizaciones de tus incidencias aparecerán aquí.
            </Text>
          </View>
        }
      />

      <Host matchContents>
        <BottomSheet
          isPresented={Boolean(selected)}
          onDismiss={() => setSelected(null)}
          snapPoints={["half", "full"]}
        >
          <NotificationDetail
            notification={selected}
            isDark={isDark}
            onClose={() => setSelected(null)}
          />
        </BottomSheet>
      </Host>
    </View>
  );
};

function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
}) {
  const isDark = useColorScheme() === "dark";
  const copy = NOTIFICATION_COPY[item.type];
  const isUnread = item.status !== "READ";

  return (
    <Pressable
      onPress={() => onPress(item)}
      className={`mb-3 flex-row gap-4 rounded-3xl p-4 ${isUnread ? "bg-blue-50 dark:bg-blue-950" : "bg-white dark:bg-gray-900"}`}
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-2xl ${isUnread ? "bg-blue-600" : "bg-gray-100 dark:bg-gray-800"}`}
      >
        <Feather
          name={copy.icon}
          size={20}
          color={isUnread ? "white" : isDark ? "#93c5fd" : "#2563eb"}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-start gap-2">
          <Text
            numberOfLines={1}
            className={`flex-1 text-base ${isUnread ? "font-bold text-gray-900 dark:text-white" : "font-semibold text-gray-700 dark:text-gray-200"}`}
          >
            {item.title || copy.label}
          </Text>
          {isUnread && (
            <View className="mt-1.5 h-2 w-2 rounded-full bg-blue-600" />
          )}
        </View>
        <Text
          numberOfLines={2}
          className="mt-1 leading-5 text-gray-500 dark:text-gray-400"
        >
          {item.message || copy.fallback}
        </Text>
        <Text className="mt-2 text-xs text-gray-400">
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function NotificationDetail({
  notification,
  isDark,
  onClose,
}: {
  notification: AppNotification | null;
  isDark: boolean;
  onClose: () => void;
}) {
  if (!notification) return null;

  const copy = NOTIFICATION_COPY[notification.type];
  const text = { color: isDark ? "#f3f4f6" : "#111827" };
  const secondary = { color: isDark ? "#9ca3af" : "#6b7280" };

  return (
    <ExpoScrollView>
      <Column spacing={14}>
        <ExpoText textStyle={{ ...text, fontSize: 22, fontWeight: "700" }}>
          {notification.title || copy.label}
        </ExpoText>
        <ExpoText textStyle={secondary}>{copy.label}</ExpoText>
        <ExpoText textStyle={{ ...text, fontSize: 16 }}>
          {notification.message || copy.fallback}
        </ExpoText>
        <ExpoText textStyle={secondary}>
          {formatDate(notification.createdAt)}
        </ExpoText>
        <Button label="Cerrar" onPress={onClose} />
      </Column>
    </ExpoScrollView>
  );
}

export default NotificationsPage;
