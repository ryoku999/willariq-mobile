import { useScreenBackground } from "@/shared/hooks/use-screen-background";
import { useAuthStore } from "@/infrastructure/storage/auth-storage";
import { useUnreadNotifications } from "@/infrastructure/hooks/use-notifications";
import Feather from "@expo/vector-icons/Feather";
import Octicons from "@expo/vector-icons/Octicons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabLayout = () => {
  const backgroundColor = useScreenBackground();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { bottom } = useSafeAreaInsets();
  const { status } = useAuthStore();
  const unreadNotifications = useUnreadNotifications(
    status === "authenticated",
  );
  const unreadCount = unreadNotifications.data?.data.count ?? 0;

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
        sceneStyle: { backgroundColor },
        tabBarActiveTintColor: isDark ? "#93c5fd" : "#2563eb",
        tabBarInactiveTintColor: isDark ? "#cbd5e1" : "#475569",
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: "600" },
        tabBarStyle: {
          height: 58 + bottom,
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
            <Octicons name="plus-circle" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="incidents"
        options={{
          title: "Incidencias",
          tabBarIcon: ({ color, size }) => (
            <Octicons name="checklist" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notificaciones",
          tabBarBadge:
            unreadCount > 0
              ? unreadCount > 99
                ? "99+"
                : unreadCount
              : undefined,
          tabBarIcon: ({ color, size }) => (
            <Octicons name="bell" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
};
export default TabLayout;
