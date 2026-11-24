import { STATUS_LABELS } from "@/features/incidents/status-labels";
import { useIncidentList } from "@/infrastructure/hooks/use-incidents";
import { formatDate } from "@/shared/utils/format-date";
import Feather from "@expo/vector-icons/Feather";
import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ChatIncidentPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (trackingCode: string) => void;
}) {
  const list = useIncidentList();
  const incidents = list.data?.pages.flatMap((page) => page.data.items) ?? [];
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const accent = useColorScheme() === "dark" ? "#bfdbfe" : "#1d4ed8";

  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType={reducedMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end px-3 sm:justify-center"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <Pressable
          accessible={false}
          onPress={onClose}
          className="absolute inset-0 bg-slate-950/40 dark:bg-black/55"
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          className="mx-auto max-h-[80%] w-full max-w-lg shrink overflow-hidden rounded-3xl border border-slate-200 bg-[#f5f7fa] dark:border-slate-700 dark:bg-slate-900"
        >
          <View className="flex-row items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
            <View className="flex-1 gap-1">
              <Text
                accessibilityRole="header"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Elige una incidencia
              </Text>
              <Text className="text-sm text-slate-600 dark:text-slate-300">
                Usaremos su código en tu consulta.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector de incidencias"
              onPress={onClose}
              className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800"
            >
              <Feather name="x" size={20} color={accent} />
            </Pressable>
          </View>
          <FlatList
            data={incidents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            style={{ flexGrow: 0 }}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => onSelect(item.trackingCode)}
                className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 active:opacity-75 dark:border-slate-700 dark:bg-slate-800"
              >
                <View className="flex-1 gap-1">
                  <Text className="text-sm font-bold text-blue-700 dark:text-blue-200">
                    {item.trackingCode}
                  </Text>
                  <Text
                    numberOfLines={2}
                    className="font-medium text-slate-900 dark:text-white"
                  >
                    {item.address ?? "Incidencia municipal"}
                  </Text>
                  <Text className="text-xs text-slate-600 dark:text-slate-300">
                    {STATUS_LABELS[item.status]} · {formatDate(item.createdAt)}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={accent} />
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="items-center gap-3 px-4 py-7">
                {list.isPending ? (
                  <ActivityIndicator
                    accessibilityLabel="Cargando incidencias"
                    color={accent}
                  />
                ) : (
                  <>
                    <Text className="text-center text-slate-700 dark:text-slate-200">
                      {list.isError
                        ? "No pudimos cargar tus incidencias."
                        : "Aún no tienes incidencias registradas."}
                    </Text>
                    {list.isError && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => void list.refetch()}
                        className="rounded-xl p-3"
                      >
                        <Text className="font-bold text-blue-700 dark:text-blue-200">
                          Reintentar
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            }
            ListFooterComponent={
              list.hasNextPage ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={list.isFetching}
                  onPress={() => void list.fetchNextPage()}
                  className="items-center rounded-xl p-3 disabled:opacity-60"
                >
                  <Text className="font-bold text-blue-700 dark:text-blue-200">
                    {list.isFetchingNextPage
                      ? "Cargando…"
                      : list.isFetchNextPageError
                        ? "Reintentar carga"
                        : "Cargar más incidencias"}
                  </Text>
                </Pressable>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}
