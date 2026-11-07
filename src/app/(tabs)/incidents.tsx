import { AccountAction } from "@/features/account/AccountAction";
import { incidentsService } from "@/infrastructure/services/incidents.service";
import type { IncidentStatus } from "@/core/entities/incidents.entity";
import {
  useIncidentAssignments,
  useIncidentDetail,
  useIncidentList,
  useIncidentEvidence,
  useIncidentHistory,
} from "@/infrastructure/hooks/use-incidents";
import { formatDate } from "@/shared/utils/format-date";
import {
  BottomSheet,
  Button,
  Column,
  ScrollView as ExpoScrollView,
  Text as ExpoText,
} from "@expo/ui";
import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";

const STATUS_LABELS: Record<IncidentStatus, string> = {
  RECEIVED: "Recibida",
  AI_ANALYSIS: "En análisis",
  IN_REVIEW: "En revisión",
  ACCEPTED: "Aceptada",
  ASSIGNED: "Asignada",
  IN_PROGRESS: "En atención",
  RESOLVED: "Resuelta",
  REJECTED: "Rechazada",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
};

const IncidentsPage = () => {
  const isDark = useColorScheme() === "dark";
  const list = useIncidentList();
  const incidents = list.data?.pages.flatMap((page) => page.data.items) ?? [];
  const [cancelTarget, setCancelTarget] = useState<{
    id: string;
    version: number;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detail = useIncidentDetail(selectedId);
  const selected = detail.data?.data;
  const history = useIncidentHistory(selectedId);
  const assignments = useIncidentAssignments(selectedId);
  const evidence = useIncidentEvidence(selectedId);
  const historyItems = history.data?.data.items ?? [];
  const assignmentItems = assignments.data?.data.items ?? [];
  const refreshDetails = () => {
    void Promise.all([
      detail.refetch(),
      list.refetch(),
      history.refetch(),
      assignments.refetch(),
      evidence.refetch(),
    ]);
  };

  const sheetText = { color: isDark ? "#e5e7eb" : "#1f2937" };
  const secondaryText = { color: isDark ? "#9ca3af" : "#6b7280" };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="pt-safe overflow-hidden bg-blue-600 px-6 pb-8 dark:bg-blue-950">
        <Text className="mt-5 text-xs font-semibold tracking-widest text-blue-100">
          MIS REPORTES
        </Text>
        <Text className="mt-2 text-3xl font-bold text-white">Incidencias</Text>
        <Text className="mt-2 text-blue-100">
          Consulta el estado de los reportes asociados a tu cuenta.
        </Text>
      </View>

      <FlatList
        data={incidents}
        refreshing={list.isRefetching}
        onRefresh={() => void list.refetch()}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetching) void list.fetchNextPage();
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedId(item.id)}
            className="mb-4 rounded-3xl bg-white p-5 dark:bg-gray-900"
          >
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold tracking-wide text-blue-600 dark:text-blue-400">
                  {item.trackingCode}
                </Text>
                <Text
                  numberOfLines={2}
                  className="mt-2 text-base leading-6 font-semibold text-gray-900 dark:text-white"
                >
                  {item.address ?? "Incidencia municipal"}
                </Text>
              </View>
              <Feather
                name="chevron-up"
                size={20}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
            </View>
            <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <View className="flex-row items-center gap-2">
                <View className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {STATUS_LABELS[item.status]}
                </Text>
              </View>
              <Text className="text-xs text-gray-400">
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
              <Feather name="clipboard" size={28} color="#2563eb" />
            </View>
            <Text className="mt-5 text-center text-xl font-bold text-gray-900 dark:text-white">
              {list.isPending
                ? "Cargando incidencias…"
                : list.isError
                  ? "No se pudieron cargar las incidencias"
                  : "Aún no tienes incidencias"}
            </Text>
            <Text className="mt-2 text-center leading-5 text-gray-500 dark:text-gray-400">
              Los reportes que envíes aparecerán aquí para darles seguimiento.
            </Text>
          </View>
        }
      />

      <BottomSheet
        isPresented={Boolean(selectedId)}
        onDismiss={() => setSelectedId(null)}
        snapPoints={["half", "full"]}
      >
        <ExpoScrollView>
          <Column spacing={14}>
            {!selected && (
              <ExpoText textStyle={sheetText}>
                {detail.isError
                  ? "No se pudo cargar la incidencia."
                  : "Cargando incidencia…"}
              </ExpoText>
            )}
            {selected && (
              <>
                <ExpoText
                  textStyle={{
                    ...sheetText,
                    fontSize: 22,
                    fontWeight: "700",
                  }}
                >
                  {selected.trackingCode}
                </ExpoText>
                <ExpoText textStyle={secondaryText}>
                  {selected.originalMessage}
                </ExpoText>
                <ExpoText
                  textStyle={{
                    color: isDark ? "#93c5fd" : "#1d4ed8",
                    fontWeight: "700",
                  }}
                >
                  {`Estado: ${STATUS_LABELS[selected.status]}`}
                </ExpoText>
                <ExpoText textStyle={secondaryText}>
                  {`Ubicación: ${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`}
                </ExpoText>
                <ExpoText textStyle={secondaryText}>
                  {`Dirección: ${selected.address || "No especificada"}`}
                </ExpoText>
                {selected.status === "RECEIVED" && (
                  <Button
                    label="Cancelar incidencia"
                    onPress={() => {
                      setCancelTarget({
                        id: selected.id,
                        version: selected.version,
                      });
                      setSelectedId(null);
                    }}
                  />
                )}

                <ExpoText
                  textStyle={{
                    ...sheetText,
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  Historial
                </ExpoText>
                {history.isLoading && (
                  <ExpoText textStyle={secondaryText}>
                    Cargando historial...
                  </ExpoText>
                )}
                {historyItems.length === 0 && !history.isLoading && (
                  <ExpoText textStyle={secondaryText}>
                    Todavía no hay cambios de estado registrados.
                  </ExpoText>
                )}
                {historyItems.map((item) => (
                  <Column key={item.id} spacing={2}>
                    <ExpoText textStyle={sheetText}>
                      {STATUS_LABELS[item.newStatus]}
                    </ExpoText>
                    <ExpoText textStyle={secondaryText}>
                      {formatDate(item.createdAt)}
                    </ExpoText>
                  </Column>
                ))}

                <ExpoText
                  textStyle={{
                    ...sheetText,
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  Asignaciones
                </ExpoText>
                {assignmentItems.length === 0 && (
                  <ExpoText textStyle={secondaryText}>
                    La incidencia aún no ha sido asignada.
                  </ExpoText>
                )}
                {assignmentItems.map((item) => (
                  <Column key={item.id} spacing={2}>
                    <ExpoText textStyle={sheetText}>{item.status}</ExpoText>
                    <ExpoText textStyle={secondaryText}>
                      {item.area?.name ?? item.assigneeName ?? "Área municipal"}
                    </ExpoText>
                  </Column>
                ))}

                <ExpoText
                  textStyle={{
                    ...sheetText,
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  Evidencias
                </ExpoText>
                <ExpoText textStyle={secondaryText}>
                  {`${evidence.data?.data.pagination.total ?? 0} evidencia(s) confirmada(s)`}
                </ExpoText>
                <Button
                  label={
                    history.isFetching || assignments.isFetching
                      ? "Actualizando..."
                      : "Actualizar seguimiento"
                  }
                  onPress={refreshDetails}
                  disabled={history.isFetching || assignments.isFetching}
                />
              </>
            )}
          </Column>
        </ExpoScrollView>
      </BottomSheet>
      <Modal
        visible={Boolean(cancelTarget)}
        transparent
        onRequestClose={() => setCancelTarget(null)}
      >
        <View className="flex-1 justify-center bg-black/50 px-6">
          {cancelTarget && (
            <AccountAction
              title="Cancelar incidencia"
              fields={[{ label: "Motivo" }]}
              run={async ([reason]) => {
                try {
                  await incidentsService.cancel(
                    cancelTarget.id,
                    cancelTarget.version,
                    reason.trim(),
                  );
                } catch (error) {
                  const current = await incidentsService
                    .detail(cancelTarget.id)
                    .catch(() => null);
                  if (current)
                    setCancelTarget({
                      id: current.data.id,
                      version: current.data.version,
                    });
                  throw error;
                }
                setCancelTarget(null);
                await list.refetch();
              }}
              success="Incidencia cancelada."
            />
          )}
          <Pressable
            onPress={() => setCancelTarget(null)}
            className="rounded-xl bg-white p-4"
          >
            <Text>Volver</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

export default IncidentsPage;
