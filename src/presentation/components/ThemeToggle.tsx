import { Appearance, Switch, useColorScheme } from "react-native";

export default function ThemeToggle() {
  const isDark = useColorScheme() === "dark";

  return (
    <Switch
      accessibilityLabel="Modo oscuro"
      value={isDark}
      onValueChange={(enabled) =>
        Appearance.setColorScheme(enabled ? "dark" : "light")
      }
      trackColor={{ false: "#64748b", true: "#2563eb" }}
      ios_backgroundColor="#64748b"
      thumbColor="#ffffff"
    />
  );
}
