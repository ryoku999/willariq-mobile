import { queryClient } from "@/config/query/query-client";
import type {
  IncidentEvidence,
  IncidentStatus,
} from "@/core/entities/incidents.entity";
import { AccountAction } from "@/features/account/AccountAction";
import {
  useIncidentAssignments,
  useIncidentDetail,
  useIncidentEvidence,
  useIncidentEvidenceImage,
  useIncidentHistory,
} from "@/infrastructure/hooks/use-incidents";
import { incidentsService } from "@/infrastructure/services/incidents.service";
import { useAuthStore } from "@/infrastructure/storage/auth-storage";
import ErrorState from "@/presentation/components/ErrorState";
import PendingState from "@/presentation/components/PendingState";
import { formatDate } from "@/shared/utils/format-date";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { STATUS_LABELS } from "./status-labels";

const body = "text-base leading-6 text-slate-800 dark:text-slate-100";
const muted = "text-sm leading-5 text-slate-600 dark:text-slate-300";
const link = "font-semibold text-blue-700 dark:text-blue-300";
const historyPreviewLimit = 3;
const statusTone: Record<
  IncidentStatus,
  "blue" | "amber" | "mint" | "slate" | "rose"
> = {
  RECEIVED: "blue",
  AI_ANALYSIS: "amber",
  IN_REVIEW: "amber",
  ACCEPTED: "blue",
  ASSIGNED: "blue",
  IN_PROGRESS: "blue",
  RESOLVED: "mint",
  REJECTED: "rose",
  CLOSED: "slate",
  CANCELLED: "rose",
};
const statusStyle = {
  blue: { icon: "activity", background: "#dbeafe", foreground: "#1e40af" },
  amber: { icon: "clock", background: "#fef3c7", foreground: "#78350f" },
  mint: { icon: "check-circle", background: "#c4f2e2", foreground: "#155348" },
  slate: { icon: "lock", background: "#e2e8f0", foreground: "#334155" },
  rose: { icon: "x-circle", background: "#ffe4e6", foreground: "#881337" },
} satisfies Record<
  string,
  {
    icon: keyof typeof Feather.glyphMap;
    background: string;
    foreground: string;
  }
>;
const assignmentLabels: Record<string, string> = {
  ASSIGNED: "Asignada",
  ACCEPTED: "Aceptada",
  IN_PROGRESS: "En atención",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  REASSIGNED: "Reasignada",
};

function EvidencePhoto({
  id,
  evidence,
}: {
  id: string;
  evidence: IncidentEvidence;
}) {
  const image = useIncidentEvidenceImage(id, evidence.id);
  const [open, setOpen] = useState(false);
  const [decodeError, setDecodeError] = useState(false);
  const isDark = useColorScheme() === "dark";
  const name =
    evidence.originalFileName || evidence.fileName || "Foto de evidencia";
  const canOpen = image.data && !decodeError;

  return (
    <View className="w-1/2 p-1.5">
      {canOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ampliar ${name}`}
          onPress={() => setOpen(true)}
          className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 active:opacity-80 dark:border-slate-600 dark:bg-slate-800"
        >
          <Image
            source={image.data}
            cachePolicy="none"
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
            onError={() => setDecodeError(true)}
          />
          <View className="absolute right-2 bottom-2 h-8 w-8 items-center justify-center rounded-lg bg-[#162b43]">
            <Feather name="maximize-2" size={16} color="#fff" />
          </View>
        </Pressable>
      ) : (
        <View className="aspect-square items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-600 dark:bg-slate-800">
          {image.isError || decodeError ? (
            <DetailAction
              label="Reintentar foto"
              onPress={() =>
                void image.refetch().then((result) => {
                  if (result.isSuccess) setDecodeError(false);
                })
              }
              disabled={image.isFetching}
            />
          ) : (
            <ActivityIndicator
              accessibilityLabel="Cargando foto"
              color={isDark ? "#93c5fd" : "#1d4ed8"}
            />
          )}
        </View>
      )}
      <Modal
        visible={open}
        onRequestClose={() => setOpen(false)}
        animationType="fade"
      >
        <View className="pb-safe pt-safe flex-1 bg-[#0b1726] px-4">
          {open && (
            <>
              <StatusBar style="light" />
              <View className="flex-row items-center gap-3 py-3">
                <Text
                  numberOfLines={1}
                  className="flex-1 font-semibold text-white"
                >
                  {name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar foto"
                  onPress={() => setOpen(false)}
                  className="h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 active:opacity-75"
                >
                  <Feather name="x" size={21} color="#fff" />
                </Pressable>
              </View>
              <Image
                source={image.data}
                cachePolicy="none"
                contentFit="contain"
                style={{ flex: 1, width: "100%" }}
                accessible
                accessibilityLabel={name}
              />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const auth = useAuthStore((state) => state.status);
  if (auth === "anonymous") return <Redirect href="/login" />;
  return (
    <View className="flex-1 bg-[#f5f7fa] dark:bg-gray-950">
      {auth !== "authenticated" || !id ? (
        <PendingState message="Cargando incidencia…" />
      ) : (
        <IncidentDetailContent key={id} id={id} />
      )}
    </View>
  );
}

function IncidentDetailContent({ id }: { id: string }) {
  const isDark = useColorScheme() === "dark";
  const accent = isDark ? "#93c5fd" : "#1d4ed8";
  const detail = useIncidentDetail(id);
  const history = useIncidentHistory(id);
  const assignments = useIncidentAssignments(id);
  const evidence = useIncidentEvidence(id);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const incident = detail.data?.data;
  const historyItems =
    history.data?.pages.flatMap((page) => page.data.items) ?? [];
  const historyPreview = history.hasNextPage
    ? historyItems.slice(0, historyPreviewLimit)
    : historyItems.slice(-historyPreviewLimit);
  const visibleHistory = historyOpen ? historyItems : historyPreview;
  const canExpandHistory =
    historyItems.length > historyPreviewLimit || history.hasNextPage;
  const images = evidence.data?.pages.flatMap((page) => page.data.items) ?? [];

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        detail.refetch(),
        history.refetch(),
        assignments.refetch(),
        evidence.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View className="pt-safe flex-1">
      <View className="flex-row items-center gap-2 border-b border-slate-200 px-4 pt-5 pb-3 dark:border-slate-800">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a incidencias"
          className="h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white active:opacity-70 dark:border-slate-600 dark:bg-slate-800"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/incidents")
          }
        >
          <Feather
            name="arrow-left"
            size={21}
            color={isDark ? "#e2e8f0" : "#16283e"}
          />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="min-w-0 flex-1 px-1 text-base font-bold text-[#16283e] dark:text-white"
        >
          Detalle de incidencia
        </Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-safe"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            colors={[accent]}
            tintColor={accent}
          />
        }
      >
        <View className="mx-auto w-full max-w-xl gap-4 px-4 py-5">
          {!incident ? (
            <View className="min-h-56 rounded-3xl border border-slate-200 bg-white py-6 dark:border-slate-700 dark:bg-slate-900">
              {detail.isError ? (
                <ErrorState
                  title="No se pudo cargar la incidencia"
                  onRetry={() => void detail.refetch()}
                  isRetrying={detail.isFetching}
                />
              ) : (
                <PendingState message="Cargando incidencia…" />
              )}
            </View>
          ) : (
            <>
              <View className="gap-3 rounded-3xl border border-[#2e4a65] bg-[#162b43] p-5 dark:border-[#52718f]">
                <View>
                  <Text className="text-sm font-medium text-slate-200">
                    Código de seguimiento
                  </Text>
                  <Text
                    selectable
                    className="mt-1 text-xl font-bold text-white"
                  >
                    {incident.trackingCode}
                  </Text>
                </View>
                <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/20 pt-3">
                  <Text className="text-sm font-medium text-slate-200">
                    Estado actual
                  </Text>
                  <StatusBadge status={incident.status} />
                </View>
              </View>

              <DetailSection title="Historial de estados" icon="clock">
                {history.isPending && (
                  <ActivityIndicator
                    accessibilityLabel="Cargando historial"
                    color={accent}
                  />
                )}
                {history.isError && (
                  <DetailAction
                    label="Reintentar historial"
                    onPress={() => void history.refetch()}
                    disabled={history.isFetching}
                  />
                )}
                {history.isSuccess && !historyItems.length && (
                  <Text className={muted}>
                    Todavía no hay cambios de estado.
                  </Text>
                )}
                {visibleHistory.map((item, index) => (
                  <View key={item.id} className="flex-row gap-3">
                    <View className="w-5 items-center">
                      <View
                        className={`mt-1 h-3 w-3 rounded-full border-2 ${index === visibleHistory.length - 1 && !history.hasNextPage ? "border-[#155348] bg-[#c4f2e2] dark:border-[#c4f2e2]" : "border-blue-700 bg-blue-100 dark:border-blue-300 dark:bg-slate-800"}`}
                      />
                      {index < visibleHistory.length - 1 && (
                        <View className="w-px flex-1 bg-slate-300 dark:bg-slate-600" />
                      )}
                    </View>
                    <View className="flex-1 pb-3">
                      <Text className="font-semibold text-slate-900 dark:text-white">
                        {STATUS_LABELS[item.newStatus]}
                      </Text>
                      <Text className={muted}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
                {canExpandHistory && (
                  <DetailAction
                    label={
                      historyOpen
                        ? "Ver menos estados"
                        : "Ver historial completo"
                    }
                    onPress={() => setHistoryOpen((current) => !current)}
                    expanded={historyOpen}
                  />
                )}
                {historyOpen && history.hasNextPage && (
                  <DetailAction
                    label={
                      history.isFetchingNextPage
                        ? "Cargando estados…"
                        : "Cargar más estados"
                    }
                    disabled={history.isFetchingNextPage}
                    onPress={() => void history.fetchNextPage()}
                  />
                )}
              </DetailSection>

              <DetailSection title="Fotos de evidencia" icon="image">
                {evidence.isPending && (
                  <ActivityIndicator
                    accessibilityLabel="Cargando evidencias"
                    color={accent}
                  />
                )}
                {evidence.isError && (
                  <DetailAction
                    label="Reintentar evidencias"
                    onPress={() => void evidence.refetch()}
                    disabled={evidence.isFetching}
                  />
                )}
                {evidence.isSuccess && !images.length && (
                  <Text className={muted}>Esta incidencia no tiene fotos.</Text>
                )}
                {images.length > 0 && (
                  <View className="-mx-1.5 flex-row flex-wrap">
                    {images.map((item) => (
                      <EvidencePhoto key={item.id} id={id} evidence={item} />
                    ))}
                  </View>
                )}
                {evidence.hasNextPage && (
                  <DetailAction
                    label={
                      evidence.isFetchingNextPage
                        ? "Cargando fotos…"
                        : "Ver más fotos"
                    }
                    disabled={evidence.isFetchingNextPage}
                    onPress={() => void evidence.fetchNextPage()}
                  />
                )}
              </DetailSection>

              <DetailSection title="Reporte original" icon="file-text">
                <Text className={body}>{incident.originalMessage}</Text>
                <View className="flex-row items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                  <Feather name="map-pin" color={accent} size={18} />
                  <View className="flex-1">
                    <Text className="font-medium text-slate-900 dark:text-white">
                      {incident.address || "Sin dirección registrada"}
                    </Text>
                    <Text className={muted}>
                      {incident.latitude.toFixed(6)},{" "}
                      {incident.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              </DetailSection>

              <DetailSection title="Asignaciones" icon="users">
                {assignments.isPending && (
                  <ActivityIndicator
                    accessibilityLabel="Cargando asignaciones"
                    color={accent}
                  />
                )}
                {assignments.isError && (
                  <DetailAction
                    label="Reintentar asignaciones"
                    onPress={() => void assignments.refetch()}
                    disabled={assignments.isFetching}
                  />
                )}
                {assignments.isSuccess &&
                  !assignments.data.data.items.length && (
                    <Text className={muted}>Todavía no hay asignaciones.</Text>
                  )}
                {assignments.data?.data.items.map((item) => (
                  <View
                    key={item.id}
                    className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800"
                  >
                    <Text className={body}>
                      {item.area?.name ?? "Área municipal"}
                    </Text>
                    <Text className={muted}>
                      {assignmentLabels[item.status] ?? "Estado sin registrar"}
                    </Text>
                  </View>
                ))}
              </DetailSection>
              {incident.status === "RECEIVED" && (
                <AccountAction
                  title="Cancelar incidencia"
                  fields={[{ label: "Motivo" }]}
                  run={async ([reason]) => {
                    try {
                      await incidentsService.cancel(
                        id,
                        incident.version,
                        reason.trim(),
                      );
                    } finally {
                      await detail.refetch();
                      await queryClient.invalidateQueries({
                        queryKey: ["incidents", "list"],
                      });
                      await history.refetch();
                    }
                  }}
                  success="Incidencia cancelada."
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const { icon, background, foreground } = statusStyle[statusTone[status]];
  return (
    <View
      className="flex-row items-center gap-2 rounded-xl px-3 py-2"
      style={{ backgroundColor: background }}
    >
      <Feather name={icon} size={17} color={foreground} />
      <Text className="font-bold" style={{ color: foreground }}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  children: ReactNode;
}) {
  const isDark = useColorScheme() === "dark";
  return (
    <View className="gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800">
          <Feather
            name={icon}
            size={19}
            color={isDark ? "#bfdbfe" : "#1d4ed8"}
          />
        </View>
        <Text
          accessibilityRole="header"
          className="flex-1 text-lg font-bold text-slate-900 dark:text-white"
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function DetailAction({
  label,
  onPress,
  disabled = false,
  expanded,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  expanded?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, expanded }}
      onPress={onPress}
      disabled={disabled}
      className="min-h-11 items-center justify-center self-start rounded-xl bg-blue-50 px-3 py-2 active:opacity-75 disabled:opacity-60 dark:bg-slate-800"
    >
      <Text className={link}>{label}</Text>
    </Pressable>
  );
}
