import { queryClient } from "@/config/query/query-client";
import type { IncidentEvidence } from "@/core/entities/incidents.entity";
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
import { formatDate } from "@/shared/utils/format-date";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { STATUS_LABELS } from "./status-labels";

const card = "gap-3 rounded-2xl bg-white p-4 dark:bg-gray-900";
const title = "text-lg font-bold text-gray-900 dark:text-white";
const body = "text-base text-gray-700 dark:text-gray-200";
const muted = "text-sm text-gray-600 dark:text-gray-400";
const link = "font-semibold text-blue-700 dark:text-blue-300";
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
  const name = evidence.fileName || "Foto de evidencia";

  return (
    <View className="min-w-0 flex-1 basis-2/5">
      {image.data ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ampliar ${name}`}
          onPress={() => setOpen(true)}
        >
          <Image
            source={image.data}
            cachePolicy="none"
            contentFit="cover"
            className="aspect-square w-full rounded-xl"
            style={{ width: "100%", aspectRatio: 1, borderRadius: 12 }}
          />
        </Pressable>
      ) : (
        <View className="aspect-square items-center justify-center rounded-xl bg-gray-100 p-2 dark:bg-gray-800">
          {image.isError ? (
            <Pressable onPress={() => void image.refetch()}>
              <Text className={link}>Reintentar foto</Text>
            </Pressable>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      )}
      <Modal
        visible={open}
        onRequestClose={() => setOpen(false)}
        animationType="fade"
      >
        <View className="pb-safe pt-safe flex-1 bg-black px-4">
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            className="self-end p-4"
          >
            <Text className="font-semibold text-white">Cerrar foto</Text>
          </Pressable>
          {open && (
            <Image
              source={image.data}
              cachePolicy="none"
              contentFit="contain"
              style={{ flex: 1 }}
              accessibilityLabel={name}
            />
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
  if (auth !== "authenticated" || !id) return <ActivityIndicator />;
  return <IncidentDetailContent key={id} id={id} />;
}

function IncidentDetailContent({ id }: { id: string }) {
  const detail = useIncidentDetail(id);
  const history = useIncidentHistory(id);
  const assignments = useIncidentAssignments(id);
  const evidence = useIncidentEvidence(id);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const incident = detail.data?.data;
  const historyItems =
    history.data?.pages.flatMap((page) => page.data.items) ?? [];
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
    <View className="pt-safe flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-2 self-start px-2 py-2"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/incidents")
          }
        >
          <Feather name="arrow-left" size={20} color="#3b82f6" />
          <Text className={link}>Volver a incidencias</Text>
        </Pressable>
        <Text className="px-2 pt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {incident?.trackingCode ?? "Detalle de incidencia"}
        </Text>
      </View>
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-safe"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
          />
        }
      >
        {!incident ? (
          <View className={card}>
            <Text className={body}>
              {detail.isError
                ? "No se pudo cargar la incidencia."
                : "Cargando incidencia…"}
            </Text>
            {detail.isError && (
              <Pressable onPress={() => void detail.refetch()}>
                <Text className={link}>Reintentar</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <View className={card}>
              <Text className={link}>{STATUS_LABELS[incident.status]}</Text>
              <Text className={title}>Reporte original</Text>
              <Text className={body}>{incident.originalMessage}</Text>
              <Text className={muted}>
                {incident.address || "Sin dirección registrada"}
              </Text>
              <Text className={muted}>
                {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
              </Text>
            </View>
            <View className={card}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: historyOpen }}
                onPress={() => setHistoryOpen(!historyOpen)}
                className="flex-row items-center justify-between py-2"
              >
                <Text className={title}>Historial de estados</Text>
                <Feather
                  name={historyOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748b"
                />
              </Pressable>
              {historyOpen && (
                <>
                  {history.isPending && <ActivityIndicator />}
                  {history.isError && (
                    <Pressable onPress={() => void history.refetch()}>
                      <Text className={link}>Reintentar historial</Text>
                    </Pressable>
                  )}
                  {history.isSuccess && !historyItems.length && (
                    <Text className={muted}>
                      Todavía no hay cambios de estado.
                    </Text>
                  )}
                  {historyItems.map((item) => (
                    <View
                      key={item.id}
                      className="gap-1 border-l-2 border-blue-400 pl-3"
                    >
                      <Text className={body}>
                        {STATUS_LABELS[item.newStatus]}
                      </Text>
                      <Text className={muted}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  ))}
                  {history.hasNextPage && (
                    <Pressable
                      disabled={history.isFetchingNextPage}
                      onPress={() => void history.fetchNextPage()}
                    >
                      <Text className={link}>Ver más estados</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
            <View className={card}>
              <Text className={title}>Evidencias</Text>
              {evidence.isPending && <ActivityIndicator />}
              {evidence.isError && (
                <Pressable onPress={() => void evidence.refetch()}>
                  <Text className={link}>Reintentar evidencias</Text>
                </Pressable>
              )}
              {evidence.isSuccess && !images.length && (
                <Text className={muted}>Esta incidencia no tiene fotos.</Text>
              )}
              <View className="flex-row flex-wrap gap-3">
                {images.map((item) => (
                  <EvidencePhoto key={item.id} id={id} evidence={item} />
                ))}
              </View>
              {evidence.hasNextPage && (
                <Pressable
                  disabled={evidence.isFetchingNextPage}
                  onPress={() => void evidence.fetchNextPage()}
                >
                  <Text className={link}>Ver más fotos</Text>
                </Pressable>
              )}
            </View>
            <View className={card}>
              <Text className={title}>Asignaciones</Text>
              {assignments.isPending && <ActivityIndicator />}
              {assignments.isError && (
                <Pressable onPress={() => void assignments.refetch()}>
                  <Text className={link}>Reintentar asignaciones</Text>
                </Pressable>
              )}
              {assignments.isSuccess && !assignments.data.data.items.length && (
                <Text className={muted}>Todavía no hay asignaciones.</Text>
              )}
              {assignments.data?.data.items.map((item) => (
                <View key={item.id}>
                  <Text className={body}>
                    {item.area?.name ?? "Área municipal"}
                  </Text>
                  <Text className={muted}>
                    {assignmentLabels[item.status] ?? "Estado sin registrar"}
                  </Text>
                </View>
              ))}
            </View>
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
      </ScrollView>
    </View>
  );
}
