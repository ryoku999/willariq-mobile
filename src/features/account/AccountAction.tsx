import axios from "axios";
import { useState } from "react";
import { Pressable, Text, TextInput, useColorScheme, View } from "react-native";

type Input = { label: string; initial?: string; secret?: boolean };

export function AccountAction({
  title,
  fields = [],
  run,
  success,
}: {
  title: string;
  fields?: Input[];
  run: (values: string[]) => Promise<unknown>;
  success: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const isDark = useColorScheme() === "dark";
  async function submit() {
    setBusy(true);
    setFeedback("");
    try {
      await run(values);
      setValues([]);
      setOpen(false);
      setFeedback(success);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      setFeedback(
        Array.isArray(message)
          ? message.join(" · ")
          : typeof message === "string"
            ? message
            : "No se pudo completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="mb-3 gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-1 dark:border-slate-700 dark:bg-slate-900">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        disabled={busy}
        className="min-h-11 justify-center"
        onPress={() => {
          setValues(fields.map((field) => field.initial ?? ""));
          setFeedback("");
          setOpen(!open);
        }}
      >
        <Text className="font-semibold text-blue-700 dark:text-blue-300">
          {title}
        </Text>
      </Pressable>
      {open && (
        <>
          {fields.map((field, index) => (
            <TextInput
              key={field.label}
              accessibilityLabel={field.label}
              placeholder={field.label}
              placeholderTextColor={isDark ? "#cbd5e1" : "#64748b"}
              secureTextEntry={field.secret}
              autoCapitalize="none"
              value={values[index] ?? ""}
              onChangeText={(value) =>
                setValues(values.map((item, i) => (i === index ? value : item)))
              }
              className="rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900 dark:border-slate-500 dark:bg-slate-800 dark:text-white"
            />
          ))}
          <Pressable
            accessibilityRole="button"
            disabled={busy || values.some((value) => !value.trim())}
            onPress={() => void submit()}
            className="min-h-11 justify-center disabled:opacity-60"
          >
            <Text className="font-semibold text-blue-700 dark:text-blue-300">
              {busy ? "Enviando…" : "Confirmar"}
            </Text>
          </Pressable>
        </>
      )}
      {!!feedback && (
        <Text
          accessibilityLiveRegion="polite"
          className="pb-2 text-slate-700 dark:text-slate-200"
        >
          {feedback}
        </Text>
      )}
    </View>
  );
}
