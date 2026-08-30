import Feather from "@expo/vector-icons/Feather";
import LogoutButton from "@/features/auth/components/LogoutButton";
import { useMe } from "@/infrastructure/hooks/use-users";
import ErrorState from "@/presentation/components/ErrorState";
import PendingState from "@/presentation/components/PendingState";
import ThemeToggle from "@/presentation/components/ThemeToggle";
import { ScrollView, Text, View } from "react-native";

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
  const fullName = `${data.firstName} ${data.lastName}`;
  const initials = `${data.firstName[0] ?? ""}${data.lastName[0] ?? ""}`;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="pt-safe overflow-hidden rounded-b-3xl bg-blue-600 px-6 pb-8 dark:bg-blue-950">
        <Text className="mt-5 text-sm font-medium text-blue-100">
          MI PERFIL
        </Text>
        <View className="mt-5 flex-row items-center gap-4">
          <View className="h-18 w-18 items-center justify-center rounded-3xl border border-blue-300 bg-blue-500 dark:border-blue-700 dark:bg-blue-900">
            <Text className="text-2xl font-bold text-white">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">{fullName}</Text>
            <Text className="mt-1 text-sm text-blue-100">{data.role}</Text>
          </View>
        </View>
      </View>

      <View className="gap-7 px-5 py-7">
        <View>
          <Text className="mb-3 text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">
            INFORMACIÓN PERSONAL
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900">
            <ProfileDetail
              icon="credit-card"
              label="Documento"
              value={data.dni}
            />
            <ProfileDetail
              icon="mail"
              label="Correo electrónico"
              value={data.email ?? "No registrado"}
              bordered
            />
            <ProfileDetail
              icon="phone"
              label="Teléfono"
              value={data.phone}
              bordered
            />
          </View>
        </View>

        <View>
          <Text className="mb-3 text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">
            APARIENCIA
          </Text>
          <View className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-gray-900">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
                <Feather name="moon" size={19} color="#2563eb" />
              </View>
              <View>
                <Text className="font-semibold text-gray-900 dark:text-white">
                  Tema de la aplicación
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  Claro u oscuro
                </Text>
              </View>
            </View>
            <ThemeToggle />
          </View>
        </View>

        <View>
          <Text className="mb-3 text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">
            CUENTA
          </Text>
          <LogoutButton />
        </View>
      </View>
    </ScrollView>
  );
};

type ProfileDetailProps = {
  icon: "credit-card" | "mail" | "phone";
  label: string;
  value: string;
  bordered?: boolean;
};

const ProfileDetail = ({
  icon,
  label,
  value,
  bordered = false,
}: ProfileDetailProps) => {
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-4 ${bordered ? "border-t border-gray-100 dark:border-gray-800" : ""}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
        <Feather name={icon} size={19} color="#2563eb" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {label}
        </Text>
        <Text className="mt-0.5 text-base font-medium text-gray-900 dark:text-white">
          {value}
        </Text>
      </View>
    </View>
  );
};

export default ProfilePage;
