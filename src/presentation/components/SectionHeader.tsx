import type { ReactNode } from "react";
import { Text, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
};

export function SectionHeader({
  title,
  description,
  action,
  children,
}: SectionHeaderProps) {
  return (
    <View className="shrink-0 border-b border-[#2e4a65] bg-[#162b43] px-5 py-4 dark:border-[#52718f]">
      <View className="flex-row items-center gap-4">
        <View className="flex-1">
          <Text
            accessibilityRole="header"
            className="text-2xl font-bold text-white"
          >
            {title}
          </Text>
          <Text className="mt-1.5 text-sm leading-5 text-slate-200">
            {description}
          </Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}
