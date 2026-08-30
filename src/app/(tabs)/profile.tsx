import { useMe } from "@/infrastructure/hooks/use-users";
import ErrorState from "@/presentation/components/ErrorState";
import PendingState from "@/presentation/components/PendingState";
import { Text, View } from "react-native";

const ProfilePage = () => {
  const me = useMe();

  if (me.isPending) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900">
        <PendingState message="Cargando tu perfil..." />
      </View>
    );
  }

  if (me.isError) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900">
        <ErrorState
          title="No pudimos cargar tu perfil"
          message="Verifica tu conexión e inténtalo nuevamente."
          onRetry={() => void me.refetch()}
          isRetrying={me.isFetching}
        />
      </View>
    );
  }

  const data = me.data.data;

  return (
    <View className="pt-safe h-screen bg-white dark:bg-gray-900">
      <Text className="will-change-variable text-xl text-gray-500 dark:text-white">
        profile page
      </Text>

      <Text>{data.dni}</Text>
    </View>
  );
};

export default ProfilePage;
