import Feather from "@expo/vector-icons/Feather";
import {
  ActivityIndicator,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
};

const ErrorState = ({
  title = "Error de conexión",
  message = "No pudimos cargar la información. Por favor, intenta nuevamente.",
  onRetry,
  isRetrying = false,
}: ErrorStateProps) => {
  const isDark = useColorScheme() === "dark";

  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <View className="h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <Feather
          name="alert-circle"
          size={32}
          color={isDark ? "#fca5a5" : "#dc2626"}
        />
      </View>

      <View className="items-center gap-1">
        <Text className="text-center text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </Text>
        <Text className="max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
          {message}
        </Text>
      </View>

      {onRetry && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reintentar la petición"
          disabled={isRetrying}
          onPress={onRetry}
          className="mt-2 min-h-11 flex-row items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 disabled:opacity-50 dark:bg-blue-500"
        >
          {isRetrying ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Feather name="refresh-cw" size={16} color="white" />
          )}
          <Text className="font-semibold text-white">
            {isRetrying ? "Reintentando..." : "Reintentar"}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default ErrorState;
