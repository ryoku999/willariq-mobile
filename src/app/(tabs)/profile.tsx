import { AccountAction } from "@/features/account/AccountAction";
import { accountService } from "@/infrastructure/services/account.service";
import { endSession } from "@/infrastructure/auth/auth-session";
import Feather from "@expo/vector-icons/Feather";
import LogoutButton from "@/features/auth/components/LogoutButton";
import { useMe } from "@/infrastructure/hooks/use-users";
import ErrorState from "@/presentation/components/ErrorState";
import PendingState from "@/presentation/components/PendingState";
import ThemeToggle from "@/presentation/components/ThemeToggle";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";

const ProfilePage = () => {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  return (
    <View className="pt-safe flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a Inicio"
          onPress={() => router.navigate("/")}
          className="h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white active:opacity-70 dark:border-slate-600 dark:bg-slate-800"
        >
          <Feather
            name="arrow-left"
            size={21}
            color={isDark ? "#e2e8f0" : "#16283e"}
          />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="text-lg font-bold text-slate-900 dark:text-white"
        >
          Mi perfil
        </Text>
      </View>
      <ProfileContent />
    </View>
  );
};

const ProfileContent = () => {
  const me = useMe();
  const isDark = useColorScheme() === "dark";

  if (me.isPending) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900">
        <PendingState message="Cargando tu perfil..." />
      </View>
    );
  }

  if (me.isError) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900">
        <ErrorState
          title="No pudimos cargar tu perfil"
          message="Verifica tu conexión e inténtalo nuevamente."
          onRetry={() => void me.refetch()}
          isRetrying={me.isFetching}
        />
      </View>
    );
  }

  const data = me.data.data;
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const initials =
    `${data.firstName[0] ?? ""}${data.lastName?.[0] ?? ""}`.toUpperCase();
  const iconColor = isDark ? "#bfdbfe" : "#1d4ed8";

  return (
    <ScrollView className="flex-1">
      <View className="mx-auto w-full max-w-xl gap-6 px-5 pt-2 pb-7">
        <View className="flex-row items-center gap-4 rounded-3xl border border-[#2e4a65] bg-[#162b43] p-5 dark:border-[#52718f]">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#c4f2e2]">
            <Text className="text-xl font-bold text-[#155348]">{initials}</Text>
          </View>
          <Text className="flex-1 text-xl font-bold text-white">
            {fullName}
          </Text>
        </View>
        <View>
          <Text
            accessibilityRole="header"
            className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100"
          >
            Información personal
          </Text>
          <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <ProfileDetail
              icon="credit-card"
              iconColor={iconColor}
              label="Documento"
              value={data.dni}
            />
            <ProfileDetail
              icon="mail"
              iconColor={iconColor}
              label="Correo electrónico"
              value={data.email ?? "No registrado"}
              bordered
            />
            <ProfileDetail
              icon="phone"
              iconColor={iconColor}
              label="Teléfono"
              value={data.phone}
              bordered
            />
          </View>
        </View>

        <View>
          <Text
            accessibilityRole="header"
            className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100"
          >
            Apariencia
          </Text>
          <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800">
              <Feather name="moon" size={19} color={iconColor} />
            </View>
            <Text className="flex-1 font-semibold text-slate-900 dark:text-white">
              Modo oscuro
            </Text>
            <ThemeToggle />
          </View>
        </View>

        <View>
          <Text
            accessibilityRole="header"
            className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100"
          >
            Cuenta
          </Text>
          <AccountAction
            title="Editar perfil"
            fields={[
              { label: "Nombres", initial: data.firstName },
              { label: "Apellidos", initial: data.lastName },
              { label: "Teléfono", initial: data.phone },
            ]}
            run={async ([firstName, lastName, phone]) => {
              await accountService.update({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
              });
              await me.refetch();
            }}
            success="Perfil actualizado."
          />
          <AccountAction
            title="Actualizar correo"
            fields={[
              { label: "Correo", initial: data.email ?? "" },
              { label: "Contraseña actual", secret: true },
            ]}
            run={async ([email, password]) => {
              await accountService.setEmail(email.trim(), password);
              await me.refetch();
            }}
            success="Correo actualizado."
          />
          {!!data.email && !data.emailVerifiedAt && (
            <>
              <AccountAction
                title="Solicitar código de verificación"
                run={accountService.requestVerification}
                success="Revisa tu correo."
              />
              <AccountAction
                title="Verificar correo"
                fields={[{ label: "Código del enlace" }]}
                run={async ([token]) => {
                  await accountService.confirmEmail(token.trim());
                  await me.refetch();
                }}
                success="Correo verificado."
              />
            </>
          )}
          <AccountAction
            title="Cambiar contraseña"
            fields={[
              { label: "Contraseña actual", secret: true },
              { label: "Nueva contraseña", secret: true },
            ]}
            run={async ([current, next]) => {
              await accountService.changePassword(current, next);
              await endSession();
            }}
            success="Contraseña actualizada."
          />
          <AccountAction
            title="Cerrar todas las sesiones"
            run={async () => {
              await accountService.logoutAll();
              await endSession();
            }}
            success="Sesiones cerradas."
          />
          <LogoutButton />
        </View>
      </View>
    </ScrollView>
  );
};

type ProfileDetailProps = {
  icon: "credit-card" | "mail" | "phone";
  iconColor: string;
  label: string;
  value: string;
  bordered?: boolean;
};

const ProfileDetail = ({
  icon,
  iconColor,
  label,
  value,
  bordered = false,
}: ProfileDetailProps) => {
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3.5 ${bordered ? "border-t border-slate-200 dark:border-slate-700" : ""}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800">
        <Feather name={icon} size={19} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-slate-600 dark:text-slate-300">
          {label}
        </Text>
        <Text className="mt-0.5 text-base font-medium text-gray-900 dark:text-white">
          {value}
        </Text>
      </View>
    </View>
  );
};

export default ProfilePage;
