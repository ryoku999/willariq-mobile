import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Alert, Linking, Pressable, Text, View } from "react-native";

const manifestUrl = process.env.EXPO_PUBLIC_APP_VERSION_URL?.trim();
const installedVersion = Constants.expoConfig?.version;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function isVersion(value: unknown): value is string {
  return typeof value === "string" && versionPattern.test(value);
}

function isNewer(published: string, installed: string) {
  const installedParts = installed.split(".");
  const publishedParts = published.split(".");
  for (const [index, part] of publishedParts.entries()) {
    const current = installedParts[index];
    if (part.length !== current.length) return part.length > current.length;
    if (part !== current) return part > current;
  }
  return false;
}

async function readVersion(url: string, signal: AbortSignal) {
  const response = await fetch(url, { cache: "no-store", signal });
  if (!response.ok) throw new Error("No se pudo consultar la versión.");
  const manifest = (await response.json()) as { version?: unknown } | null;
  if (!isVersion(manifest?.version)) throw new Error("Versión inválida.");
  return manifest.version;
}

export function AppVersionNotice() {
  const version = useQuery({
    queryKey: ["app-version", manifestUrl],
    enabled: Boolean(manifestUrl) && isVersion(installedVersion),
    queryFn: ({ signal }) => readVersion(manifestUrl!, signal),
    refetchInterval: 5 * 60_000,
    retry: false,
  });

  if (!manifestUrl || !isVersion(installedVersion) || !version.isSuccess) {
    return null;
  }

  if (!isNewer(version.data, installedVersion)) {
    return (
      <Text className="mt-4 text-center text-xs text-slate-600 dark:text-slate-300">
        ✓ App actualizada · v{installedVersion}
      </Text>
    );
  }

  return (
    <View className="mt-3 flex-row flex-wrap items-center justify-between gap-x-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1 dark:border-emerald-800 dark:bg-emerald-950">
      <Text className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
        Actualización disponible · v{version.data}
      </Text>
      <Pressable
        accessibilityRole="link"
        className="min-h-11 flex-row items-center gap-1"
        onPress={() => {
          const downloadUrl = new URL("./index.html#descarga", manifestUrl);
          void Linking.openURL(downloadUrl.href).catch(() => {
            Alert.alert("No pudimos abrir la página de descarga.");
          });
        }}
      >
        <Text className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
          Descargar
        </Text>
        <Feather name="external-link" size={13} color="#34a577" />
      </Pressable>
    </View>
  );
}
