import ThemeToggle from "@/presentation/components/ThemeToggle";
import { Text, View } from "react-native";

const HomePage = () => {
  return (
    <View className="pt-safe h-screen bg-white dark:bg-gray-900">
      <Text className="text-2xl text-gray-500 dark:text-white">
        Homa desde la pagina de inicio
      </Text>

      <ThemeToggle />
    </View>
  );
};
export default HomePage;
