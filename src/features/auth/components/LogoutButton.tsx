import Feather from "@expo/vector-icons/Feather";
import { useLogout } from "@/infrastructure/hooks/use-auth";
import {
  ActivityIndicator,
  Pressable,
  Text,
  useColorScheme,
} from "react-native";

const LogoutButton = () => {
  const logout = useLogout();
  const iconColor = useColorScheme() === "dark" ? "#fca5a5" : "#b91c1c";

  const onLogout = () => {
    logout.mutate();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      onPress={onLogout}
      disabled={logout.isPending}
      className="min-h-13 flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 disabled:opacity-50 dark:border-red-900 dark:bg-red-950"
    >
      {logout.isPending ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <Feather name="log-out" size={19} color={iconColor} />
      )}
      <Text className="font-semibold text-red-700 dark:text-red-300">
        {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
      </Text>
    </Pressable>
  );
};
export default LogoutButton;
