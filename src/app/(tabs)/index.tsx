import { HomeMenu } from "@/features/home/components/home-menu";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";

const logo = require("../../../assets/images/logo-v3.jpeg");

export default function HomePage() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View className="pt-safe flex-1 bg-[#f5f7fa] dark:bg-gray-950">
      <ScrollView className="flex-1">
        <View className="mx-auto w-full max-w-xl px-5 pb-8">
          <View className="flex-row items-center justify-between py-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir menú"
              accessibilityState={{ expanded: menuOpen }}
              onPress={() => setMenuOpen(true)}
              className="h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white active:opacity-70 dark:border-slate-600 dark:bg-slate-800"
            >
              <Feather
                name="menu"
                size={23}
                color={isDark ? "#e2e8f0" : "#16283e"}
              />
            </Pressable>
            <Image
              source={logo}
              accessible
              accessibilityLabel="Willariq"
              contentFit="contain"
              style={{ width: 68, height: 68, borderRadius: 18 }}
            />
          </View>

          <View className="mt-4 mb-7">
            <Text
              accessibilityRole="header"
              className="text-4xl font-bold tracking-tight text-[#16283e] dark:text-white"
            >
              Hola, ciudadano
            </Text>
            <Text className="mt-2 max-w-sm text-base leading-6 text-slate-600 dark:text-slate-300">
              Reporta incidencias y consulta la información municipal que
              necesites.
            </Text>
          </View>

          <Text
            accessibilityRole="header"
            className="mb-3 text-lg font-bold text-[#16283e] dark:text-slate-100"
          >
            Accesos rápidos
          </Text>

          <View className="gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reportar una incidencia"
              accessibilityHint="Abre el formulario de reporte"
              onPress={() => router.navigate("/report")}
              className="rounded-3xl border border-[#f0c8c0] bg-[#fff1ed] p-5 active:opacity-75 dark:border-[#a0685f] dark:bg-[#352320]"
            >
              <View className="flex-row items-start gap-4">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#a83b32]">
                  <Feather name="alert-circle" size={23} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-[#822e27] dark:text-[#ffc3b8]">
                    Reportar incidencia
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-[#70453f] dark:text-[#edd3ce]">
                    Envía un problema de tu zona con ubicación y evidencias.
                  </Text>
                </View>
              </View>
              <View className="mt-4 flex-row items-center justify-between rounded-xl bg-[#a83b32] px-4 py-3">
                <Text className="font-semibold text-white">Crear reporte</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir asistente municipal"
              accessibilityHint="Abre el chat de Willariq"
              onPress={() => router.push("/chat")}
              className="rounded-3xl border border-[#273f58] bg-[#162b43] p-5 active:opacity-75 dark:border-[#466482] dark:bg-[#172c44]"
            >
              <View className="flex-row items-start gap-4">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#c4f2e2]">
                  <MaterialCommunityIcons
                    name="robot-outline"
                    size={25}
                    color="#155348"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white">
                    Asistente municipal
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-slate-200">
                    Consulta servicios municipales o el estado de una
                    incidencia.
                  </Text>
                </View>
              </View>
              <View className="mt-4 flex-row items-center justify-between border-t border-white/20 pt-3">
                <Text className="font-semibold text-[#c4f2e2]">Abrir chat</Text>
                <Feather name="arrow-right" size={18} color="#c4f2e2" />
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      {menuOpen && (
        <HomeMenu
          onClose={() => setMenuOpen(false)}
          onProfile={() => {
            setMenuOpen(false);
            router.navigate("/profile");
          }}
        />
      )}
    </View>
  );
}
