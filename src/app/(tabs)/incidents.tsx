import { STATUS_LABELS } from "@/features/incidents/status-labels";
import { useIncidentList } from "@/infrastructure/hooks/use-incidents";
import { formatDate } from "@/shared/utils/format-date";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";

const IncidentsPage = () => {
  const isDark = useColorScheme() === "dark";
  const list = useIncidentList();
  const incidents = list.data?.pages.flatMap((page) => page.data.items) ?? [];
  return (
    <View className="pt-safe flex-1 bg-[#f5f7fa] dark:bg-gray-950">
      <FlatList
        className="mt-5"
        data={incidents}
        refreshing={list.isRefetching}
        onRefresh={() => void list.refetch()}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetching) void list.fetchNextPage();
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/incident-detail/[id]",
                params: { id: item.id },
              })
            }
            className="mb-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
          >
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold tracking-wide text-blue-700 dark:text-blue-300">
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
                name="chevron-right"
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
              <Text className="text-xs text-slate-600 dark:text-slate-300">
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8">
            {list.isPending ? (
              <ActivityIndicator
                accessibilityLabel="Cargando incidencias"
                color={isDark ? "#bfdbfe" : "#1d4ed8"}
              />
            ) : list.isError ? (
              <Text className="text-center font-medium text-slate-700 dark:text-slate-200">
                No se pudieron cargar las incidencias.
              </Text>
            ) : (
              <View
                accessible
                accessibilityLabel="Aún no tienes incidencias"
                className="h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950"
              >
                <Feather
                  name="clipboard"
                  size={28}
                  color={isDark ? "#bfdbfe" : "#1d4ed8"}
                />
              </View>
            )}
          </View>
        }
      />
    </View>
  );
};

export default IncidentsPage;
