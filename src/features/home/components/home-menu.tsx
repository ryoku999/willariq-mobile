import { useMe } from "@/infrastructure/hooks/use-users";
import Feather from "@expo/vector-icons/Feather";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, { SlideInLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HomeMenuProps = {
  onClose: () => void;
  onProfile: () => void;
};

export function HomeMenu({ onClose, onProfile }: HomeMenuProps) {
  const { data } = useMe();
  const account = data?.data;
  const name = account
    ? [account.firstName, account.lastName].filter(Boolean).join(" ")
    : "";
  const initials = account
    ? `${account.firstName[0] ?? ""}${account.lastName?.[0] ?? ""}`.toUpperCase()
    : "";
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const iconColor = isDark ? "#e2e8f0" : "#16283e";

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1"
        style={{ marginTop: insets.top, marginBottom: insets.bottom }}
      >
        <Pressable
          accessible={false}
          onPress={onClose}
          className="absolute inset-0 bg-slate-950/30 dark:bg-black/45"
        />
        <Animated.View
          entering={SlideInLeft.duration(230)}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={{
            marginTop: 12,
            marginBottom: 12,
            marginLeft: Math.max(12, insets.left),
            width: "82%",
            maxWidth: 304,
            flexShrink: 1,
          }}
        >
          <View className="shrink overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900">
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ padding: 16 }}
            >
              <View className="mb-4 flex-row items-center justify-between">
                <Text
                  accessibilityRole="header"
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  Mi cuenta
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar menú"
                  onPress={onClose}
                  className="h-11 w-11 items-center justify-center rounded-xl bg-slate-100 active:opacity-70 dark:bg-slate-700"
                >
                  <Feather name="x" size={21} color={iconColor} />
                </Pressable>
              </View>

              <View className="mb-3 flex-row items-center gap-3 rounded-2xl bg-[#162b43] p-4">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#c4f2e2]">
                  {initials ? (
                    <Text className="text-lg font-bold text-[#155348]">
                      {initials}
                    </Text>
                  ) : (
                    <Feather name="user" size={22} color="#155348" />
                  )}
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-bold text-white">
                    {name || "Mi cuenta"}
                  </Text>
                  {account?.email && (
                    <Text
                      numberOfLines={2}
                      className="mt-1 text-sm text-slate-200"
                    >
                      {account.email}
                    </Text>
                  )}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={onProfile}
                className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 active:opacity-70 dark:border-slate-600 dark:bg-slate-800"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-700">
                  <Feather name="user" size={19} color={iconColor} />
                </View>
                <Text className="flex-1 font-semibold text-slate-900 dark:text-white">
                  Mi perfil
                </Text>
                <Feather name="chevron-right" size={19} color={iconColor} />
              </Pressable>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
