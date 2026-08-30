import { loginSchema, loginT } from "@/features/auth/schemas/login.scheme";
import { useLogin } from "@/infrastructure/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const LoginPage = () => {
  const login = useLogin();

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
    login.mutate(values, {
      onError: (err) => {
        console.log("Error:", err);
      },
    });
  };

  return (
    <View className="pt-safe flex-1 bg-white px-6 dark:bg-gray-900">
      <Text className="mb-6 text-2xl font-bold text-black dark:text-white">
        Iniciar sesión
      </Text>

      {/* DNI */}
      <View className="mb-4">
        <Text className="mb-2 text-black dark:text-white">DNI</Text>

        <Controller
          control={control}
          name="dni"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ingresa tu DNI"
              keyboardType="numeric"
              maxLength={8}
              className="rounded-xl border border-gray-300 px-4 py-3 text-black dark:border-gray-700 dark:text-white"
            />
          )}
        />

        {errors.dni && (
          <Text className="mt-1 text-red-500">{errors.dni.message}</Text>
        )}
      </View>

      {/* PASSWORD */}
      <View className="mb-6">
        <Text className="mb-2 text-black dark:text-white">Contraseña</Text>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ingresa tu contraseña"
              secureTextEntry
              className="rounded-xl border border-gray-300 px-4 py-3 text-black dark:border-gray-700 dark:text-white"
            />
          )}
        />

        {errors.password && (
          <Text className="mt-1 text-red-500">{errors.password.message}</Text>
        )}
      </View>

      {/* BOTÓN */}
      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={login.isPending}
        className="items-center rounded-xl bg-blue-600 px-4 py-4 disabled:opacity-50"
      >
        {login.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="font-semibold text-white">Iniciar sesión</Text>
        )}
      </Pressable>
    </View>
  );
};

export default LoginPage;
