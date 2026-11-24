import { KeyboardAwareScrollView } from "@/presentation/components/KeyboardAwareScrollView";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

const logo = require("../../../../assets/images/logo-v3.jpeg");

export function AuthFormLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View className="pt-safe flex-1 bg-[#f5f7fa] dark:bg-gray-950">
      <KeyboardAwareScrollView
        className="flex-1"
        bottomOffset={16}
        contentContainerClassName="pb-safe"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-md gap-5 px-5 py-5">
          <View className="gap-3">
            <Image
              source={logo}
              accessible
              accessibilityLabel="Willariq"
              contentFit="contain"
              style={{ width: 80, height: 80, borderRadius: 22 }}
            />
            <View>
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
          </View>
          <View className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            {children}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
