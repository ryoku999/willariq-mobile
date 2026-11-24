import { AccountAction } from "@/features/account/AccountAction";
import { AuthFormLayout } from "@/features/auth/components/AuthFormLayout";
import { accountService } from "@/infrastructure/services/account.service";
import { Link } from "expo-router";
import { View } from "react-native";

export default function RecoverPage() {
  return (
    <AuthFormLayout
      title="Recuperar contraseña"
      description="Solicita un correo de recuperación o usa el código que recibiste."
    >
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
      <View className="items-center border-t border-slate-200 pt-1 dark:border-slate-700">
        <Link
          href="/login"
          className="min-h-11 py-3 font-semibold text-blue-700 dark:text-blue-300"
        >
          Volver al inicio de sesión
        </Link>
      </View>
    </AuthFormLayout>
  );
}
