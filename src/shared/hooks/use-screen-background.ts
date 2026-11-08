import { useColorScheme } from "react-native";

export function useScreenBackground() {
  return useColorScheme() === "dark" ? "#030712" : "#f9fafb";
}
