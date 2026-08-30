import { useAuthStore } from "@/infrastructure/storage/auth-storage";
import Feather from "@expo/vector-icons/Feather";
import Octicons from "@expo/vector-icons/Octicons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, useColorScheme, View } from "react-native";

const TabLayout = () => {
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

  if (status === "anonymous") {
    return (
      <Redirect
        href={{
          pathname: "/login",
        }}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#93c5fd" : "#2563eb",
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "#6b7280",
        tabBarStyle: {
          backgroundColor: isDark ? "#111827" : "#ffffff",
          borderTopColor: isDark ? "#374151" : "#e5e7eb",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: "Reportar",
          tabBarIcon: ({ color, size }) => (
            <Octicons name="report" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Octicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};
export default TabLayout;
