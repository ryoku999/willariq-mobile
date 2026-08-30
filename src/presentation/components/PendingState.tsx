import { ActivityIndicator, Text, useColorScheme, View } from "react-native";

type PendingStateProps = {
  message?: string;
};

const PendingState = ({
  message = "Cargando información...",
}: PendingStateProps) => {
  const isDark = useColorScheme() === "dark";

  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
        <ActivityIndicator
          color={isDark ? "#93c5fd" : "#2563eb"}
          size="large"
        />
      </View>
      <Text className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
        {message}
      </Text>
    </View>
  );
};
export default PendingState;
