import { AccountAction } from "@/features/account/AccountAction";
import { accountService } from "@/infrastructure/services/account.service";
import { Link } from "expo-router";
import { ScrollView, Text } from "react-native";

export default function RecoverPage() {
  return (
    <ScrollView
      className="pt-safe flex-1 bg-gray-50 px-6 dark:bg-gray-950"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mt-6 mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Recuperar contraseña
      </Text>
      <AccountAction
        title="Solicitar correo de recuperación"
        fields={[{ label: "Correo" }]}
        run={([email]) => accountService.forgot(email.trim())}
        success="Si la cuenta puede recuperar su acceso, recibirás un correo."
      />
      <AccountAction
        title="Ya tengo el código del correo"
        fields={[
          { label: "Código del enlace" },
          { label: "Nueva contraseña", secret: true },
        ]}
        run={([token, password]) =>
          accountService.reset(token.trim(), password)
        }
        success="Contraseña restablecida. Ya puedes iniciar sesión."
      />
      <Link href="/login" className="py-4 text-blue-600 dark:text-blue-400">
        Volver al inicio de sesión
      </Link>
    </ScrollView>
  );
}
