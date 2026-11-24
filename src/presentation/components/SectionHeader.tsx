import { Text, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  description: string;
};

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <View className="shrink-0 px-5 pt-5 pb-4">
      <Text
        accessibilityRole="header"
        className="text-3xl font-bold tracking-tight text-[#16283e] dark:text-white"
      >
        {title}
      </Text>
      <Text className="mt-1.5 text-base leading-6 text-slate-600 dark:text-slate-300">
        {description}
      </Text>
    </View>
  );
}
