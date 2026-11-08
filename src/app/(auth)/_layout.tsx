import { useScreenBackground } from "@/shared/hooks/use-screen-background";
import { useAuthStore } from "@/infrastructure/storage/auth-storage";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, useColorScheme, View } from "react-native";

const AuthLayout = () => {
  const backgroundColor = useScreenBackground();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { status } = useAuthStore();

  if (status === "hydrating") {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor }}
      >
        <ActivityIndicator color={isDark ? "#93c5fd" : "#2563eb"} />
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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: { backgroundColor },
      }}
    />
  );
};
export default AuthLayout;
