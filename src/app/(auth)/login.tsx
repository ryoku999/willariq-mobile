import { loginSchema, loginT } from "@/features/auth/schemas/login.scheme";
import { useLogin } from "@/infrastructure/hooks/use-auth";
import { getApiErrorMessages } from "@/shared/errors/api-error";
import Feather from "@expo/vector-icons/Feather";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

const LoginPage = () => {
  const login = useLogin();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const isDark = useColorScheme() === "dark";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<loginT>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      dni: "",
      password: "",
    },
  });

  const onSubmit = (values: loginT) => {
    setApiErrors([]);
    login.mutate(values, {
      onError: (err) => {
        console.error("Error al iniciar sesión:", err);
        setApiErrors(getApiErrorMessages(err));
      },
    });
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      bottomOffset={16}
      contentContainerClassName="flex-grow pb-safe"
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <View className="pt-safe rounded-b-3xl bg-blue-600 px-6 pb-12 dark:bg-blue-950">
        <Text className="mt-6 text-sm font-semibold tracking-widest text-blue-100">
          WILLARIQ
        </Text>
        <Text className="mt-5 text-3xl font-bold text-white">
          Bienvenido de vuelta
        </Text>
        <Text className="mt-2 text-base leading-6 text-blue-100">
          Ingresa tus datos para continuar en la aplicación.
        </Text>
      </View>

      <View className="mx-5 -mt-5 rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-900">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          Iniciar sesión
        </Text>
        <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Usa las credenciales registradas para tu cuenta.
        </Text>

        <View className="mt-7 gap-5">
          <View>
            <Text className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Documento de identidad
            </Text>
            <View
              className={`flex-row items-center rounded-2xl border bg-gray-50 px-4 dark:bg-gray-950 ${errors.dni ? "border-red-500" : "border-gray-200 dark:border-gray-800"}`}
            >
              <Feather
                name="credit-card"
                size={19}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
              <Controller
                control={control}
                name="dni"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ingresa tu DNI"
                    placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                    keyboardType="numeric"
                    maxLength={8}
                    returnKeyType="next"
                    className="flex-1 px-3 py-4 text-base text-gray-900 dark:text-white"
                  />
                )}
              />
            </View>
            {errors.dni && (
              <Text className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.dni.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Contraseña
            </Text>
            <View
              className={`flex-row items-center rounded-2xl border bg-gray-50 px-4 dark:bg-gray-950 ${errors.password ? "border-red-500" : "border-gray-200 dark:border-gray-800"}`}
            >
              <Feather
                name="lock"
                size={19}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    className="flex-1 px-3 py-4 text-base text-gray-900 dark:text-white"
                  />
                )}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isPasswordVisible
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                hitSlop={8}
                onPress={() => setPasswordVisible((visible) => !visible)}
              >
                <Feather
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={19}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </Pressable>
            </View>
            {errors.password && (
              <Text className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </Text>
            )}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
          onPress={handleSubmit(onSubmit)}
          disabled={login.isPending}
          className="mt-7 min-h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 disabled:opacity-50 dark:bg-blue-500"
        >
          {login.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Feather name="log-in" size={19} color="white" />
          )}
          <Text className="text-base font-semibold text-white">
            {login.isPending ? "Ingresando..." : "Iniciar sesión"}
          </Text>
        </Pressable>

        {apiErrors.length > 0 && (
          <View className="mt-4 gap-1 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
            {apiErrors.map((message) => (
              <Text
                key={message}
                className="text-sm text-red-700 dark:text-red-300"
              >
                {message}
              </Text>
            ))}
          </View>
        )}

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            ¿No tienes una cuenta?
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear una cuenta"
            onPress={() => router.push("/register")}
          >
            <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Regístrate
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default LoginPage;
