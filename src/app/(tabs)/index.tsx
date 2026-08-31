import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

const HomePage = () => {
  const router = useRouter();

  return (
    <View className="pt-safe flex-1 bg-gray-50 px-5 dark:bg-gray-950">
      <View className="mt-8">
        <Text className="text-xs font-semibold tracking-widest text-blue-600 dark:text-blue-400">
          WILLARIQ
        </Text>
        <Text className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Hola, ciudadano
        </Text>
        <Text className="mt-2 text-base leading-6 text-gray-600 dark:text-gray-300">
          Reporta incidencias y consulta la información municipal que necesites.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir asistente municipal"
        onPress={() => router.push("/chat")}
        className="mt-8 overflow-hidden rounded-3xl bg-blue-600 p-6 dark:bg-blue-900"
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
          <Feather name="message-circle" size={24} color="white" />
        </View>
        <Text className="mt-5 text-2xl font-bold text-white">
          Asistente municipal
        </Text>
        <Text className="mt-2 max-w-xs leading-5 text-blue-100">
          Resuelve dudas sobre servicios municipales o consulta el estado de una
          incidencia.
        </Text>
        <View className="mt-5 flex-row items-center gap-2">
          <Text className="font-bold text-white">Iniciar consulta</Text>
          <Feather name="arrow-up-right" size={18} color="white" />
        </View>
      </Pressable>

      <View className="mt-8 rounded-2xl bg-white p-5 dark:bg-gray-900">
        <Text className="font-bold text-gray-900 dark:text-white">
          ¿Necesitas reportar un problema?
        </Text>
        <Text className="mt-2 leading-5 text-gray-500 dark:text-gray-400">
          Usa la pestaña Reportar para enviar una incidencia con ubicación y
          evidencias.
        </Text>
      </View>
    </View>
  );
};
export default HomePage;
