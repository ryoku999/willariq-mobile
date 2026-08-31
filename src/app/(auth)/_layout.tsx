import { useAuthStore } from "@/infrastructure/storage/auth-storage";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, useColorScheme, View } from "react-native";

const AuthLayout = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { status } = useAuthStore();

  if (status === "hydrating") {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator color={`${isDark ? "#111827" : "#ffffff"}`} />
      </View>
    );
  }

  if (status === "authenticated") {
    return (
      <Redirect
        href={{
          pathname: "/",
        }}
      />
    );
  }

  return <Stack screenOptions={{ headerShown: false, animation: "none" }} />;
};
export default AuthLayout;
