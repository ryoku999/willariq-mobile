import { queryClient } from "@/config/query/query-client";
import { useAuthStore } from "@/infrastructure/storage/auth-storage";
import "@/styles/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="chat" />
        </Stack>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
