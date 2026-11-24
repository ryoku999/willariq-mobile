import { AuthFormLayout } from "@/features/auth/components/AuthFormLayout";
import {
  userCreateReqSchema,
  UserCreateReqT,
} from "@/features/auth/schemas/user-register.scheme";
import { useRegisterCitizen } from "@/infrastructure/hooks/use-auth";
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

const RegisterPage = () => {
  const registerCitizen = useRegisterCitizen();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const isDark = useColorScheme() === "dark";
  const iconColor = isDark ? "#bfdbfe" : "#475569";
  const placeholderColor = isDark ? "#cbd5e1" : "#475569";
  const primaryIconColor = isDark ? "#155348" : "#ffffff";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserCreateReqT>({
    resolver: zodResolver(userCreateReqSchema),
    defaultValues: {
      dni: "",
      password: "",
    },
  });

  const onSubmit = (values: UserCreateReqT) => {
    setApiErrors([]);
    registerCitizen.mutate(values, {
      onError: (error) => setApiErrors(getApiErrorMessages(error)),
    });
  };

  return (
    <AuthFormLayout
      title="Crea tu cuenta"
      description="Usa tu DNI y elige una contraseña. Podrás completar tu perfil después."
    >
      <View className="gap-4">
        <View>
          <Text className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Documento de identidad
          </Text>
          <View
            className={`flex-row items-center rounded-2xl border bg-slate-50 px-4 dark:bg-slate-800 ${errors.dni ? "border-red-500" : "border-slate-300 dark:border-slate-500"}`}
          >
            <Feather name="credit-card" size={19} color={iconColor} />
            <Controller
              control={control}
              name="dni"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ingresa tu DNI"
                  accessibilityLabel="Documento de identidad"
                  placeholderTextColor={placeholderColor}
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
            Contraseña
          </Text>
          <View
            className={`flex-row items-center rounded-2xl border bg-slate-50 pr-1 pl-4 dark:bg-slate-800 ${errors.password ? "border-red-500" : "border-slate-300 dark:border-slate-500"}`}
          >
            <Feather name="lock" size={19} color={iconColor} />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Crea una contraseña"
                  accessibilityLabel="Contraseña"
                  placeholderTextColor={placeholderColor}
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
                isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              className="h-11 w-11 items-center justify-center rounded-xl active:bg-slate-200 dark:active:bg-slate-700"
              onPress={() => setPasswordVisible((visible) => !visible)}
            >
              <Feather
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={19}
                color={iconColor}
              />
            </Pressable>
          </View>
          {errors.password && <FieldError message={errors.password.message} />}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear cuenta"
        onPress={handleSubmit(onSubmit)}
        disabled={registerCitizen.isPending}
        className="mt-6 min-h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-[#162b43] px-5 py-4 active:opacity-75 disabled:opacity-60 dark:bg-[#c4f2e2]"
      >
        {registerCitizen.isPending ? (
          <ActivityIndicator color={primaryIconColor} />
        ) : (
          <Feather name="user-plus" size={19} color={primaryIconColor} />
        )}
        <Text className="text-base font-semibold text-white dark:text-[#155348]">
          {registerCitizen.isPending ? "Creando cuenta..." : "Crear cuenta"}
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

      <View className="mt-4 flex-row flex-wrap items-center justify-center gap-x-1 border-t border-slate-200 pt-1 dark:border-slate-700">
        <Text className="text-sm text-slate-600 dark:text-slate-300">
          ¿Ya tienes una cuenta?
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a iniciar sesión"
          onPress={() => router.replace("/login")}
          className="min-h-11 justify-center px-1"
        >
          <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Inicia sesión
          </Text>
        </Pressable>
      </View>
    </AuthFormLayout>
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
