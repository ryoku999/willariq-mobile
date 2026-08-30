import { useLogout } from "@/infrastructure/hooks/use-auth";
import { ActivityIndicator, Pressable, Text } from "react-native";

const LogoutButton = () => {
  const logout = useLogout();

  const onLogout = () => {
    logout.mutate();
  };

  return (
    <Pressable
      onPress={onLogout}
      disabled={logout.isPending}
      className="items-center rounded-xl bg-red-500 disabled:opacity-50"
    >
      {logout.isPending ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className="font-semibold text-white">Cerrar sesion</Text>
      )}
    </Pressable>
  );
};
export default LogoutButton;
