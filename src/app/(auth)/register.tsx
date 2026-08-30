import Feather from "@expo/vector-icons/Feather";
import {
  userCreateReqSchema,
  UserCreateReqT,
} from "@/features/auth/schemas/user-register.scheme";
import { useCreateUser } from "@/infrastructure/hooks/use-auth";
import { getApiErrorMessages } from "@/shared/errors/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

const RegisterPage = () => {
  const createUser = useCreateUser();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const isDark = useColorScheme() === "dark";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserCreateReqT>({
    resolver: zodResolver(userCreateReqSchema),
    defaultValues: {
      dni: "",
      firstName: "",
      lastName: "",
      password: "",
      phone: "",
    },
  });

  const onSubmit = (values: UserCreateReqT) => {
    setApiErrors([]);
    createUser.mutate(
      { ...values, lastName: values.lastName || null },
      {
        onSuccess: () => {
          router.replace("/login");
        },
        onError: (error) => {
          console.error("Error al registrar usuario:", error);
          setApiErrors(getApiErrorMessages(error));
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-safe rounded-b-3xl bg-blue-600 px-6 pb-12 dark:bg-blue-950">
          <Text className="mt-6 text-sm font-semibold tracking-widest text-blue-100">
            WILLARIQ
          </Text>
          <Text className="mt-5 text-3xl font-bold text-white">
            Crea tu cuenta
          </Text>
          <Text className="mt-2 text-base leading-6 text-blue-100">
            Completa tus datos para comenzar a usar la aplicación.
          </Text>
        </View>

        <View className="mx-5 -mt-5 rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Registro de usuario
          </Text>
          <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Todos los campos, excepto el apellido, son obligatorios.
          </Text>

          <View className="mt-7 gap-5">
            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                Nombres
              </Text>
              <View
                className={`flex-row items-center rounded-2xl border bg-gray-50 px-4 dark:bg-gray-950 ${errors.firstName ? "border-red-500" : "border-gray-200 dark:border-gray-800"}`}
              >
                <Feather
                  name="user"
                  size={19}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ingresa tus nombres"
                      placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                      autoCapitalize="words"
                      className="flex-1 px-3 py-4 text-base text-gray-900 dark:text-white"
                    />
                  )}
                />
              </View>
              {errors.firstName && (
                <FieldError message={errors.firstName.message} />
              )}
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                Apellidos{" "}
                <Text className="font-normal text-gray-400">(opcional)</Text>
              </Text>
              <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-800 dark:bg-gray-950">
                <Feather
                  name="users"
                  size={19}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ingresa tus apellidos"
                      placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                      autoCapitalize="words"
                      className="flex-1 px-3 py-4 text-base text-gray-900 dark:text-white"
                    />
                  )}
                />
              </View>
            </View>

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
                      className="flex-1 px-3 py-4 text-base text-gray-900 dark:text-white"
                    />
                  )}
                />
              </View>
              {errors.dni && <FieldError message={errors.dni.message} />}
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                Teléfono
              </Text>
              <View
                className={`flex-row items-center rounded-2xl border bg-gray-50 px-4 dark:bg-gray-950 ${errors.phone ? "border-red-500" : "border-gray-200 dark:border-gray-800"}`}
              >
                <Feather
                  name="phone"
                  size={19}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ingresa tu teléfono"
                      placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                      keyboardType="phone-pad"
                      maxLength={9}
                      className="flex-1 px-3 py-4 text-base text-gray-900 dark:text-white"
                    />
                  )}
                />
              </View>
              {errors.phone && <FieldError message={errors.phone.message} />}
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
                      placeholder="Crea una contraseña"
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
                <FieldError message={errors.password.message} />
              )}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta"
            onPress={handleSubmit(onSubmit)}
            disabled={createUser.isPending}
            className="mt-7 min-h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 disabled:opacity-50 dark:bg-blue-500"
          >
            {createUser.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Feather name="user-plus" size={19} color="white" />
            )}
            <Text className="text-base font-semibold text-white">
              {createUser.isPending ? "Creando cuenta..." : "Crear cuenta"}
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
              ¿Ya tienes una cuenta?
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir a iniciar sesión"
              onPress={() => router.replace("/login")}
            >
              <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                Inicia sesión
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;

  return (
    <Text className="mt-1.5 text-sm text-red-600 dark:text-red-400">
      {message}
    </Text>
  );
};

export default RegisterPage;
