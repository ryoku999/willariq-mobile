import axios from "axios";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
    <View className="mb-3 gap-2 rounded-2xl bg-white p-4 dark:bg-gray-900">
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => {
          setValues(fields.map((field) => field.initial ?? ""));
          setFeedback("");
          setOpen(!open);
        }}
      >
        <Text className="font-semibold text-blue-600 dark:text-blue-400">
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
              placeholderTextColor="#6b7280"
              secureTextEntry={field.secret}
              autoCapitalize="none"
              value={values[index] ?? ""}
              onChangeText={(value) =>
                setValues(values.map((item, i) => (i === index ? value : item)))
              }
              className="rounded-xl border border-gray-300 p-3 text-gray-900 dark:border-gray-600 dark:text-white"
            />
          ))}
          <Pressable
            accessibilityRole="button"
            disabled={busy || values.some((value) => !value.trim())}
            onPress={() => void submit()}
          >
            <Text className="font-semibold text-blue-600 dark:text-blue-400">
              {busy ? "Enviando…" : "Confirmar"}
            </Text>
          </Pressable>
        </>
      )}
      {!!feedback && (
        <Text
          accessibilityLiveRegion="polite"
          className="text-gray-700 dark:text-gray-200"
        >
          {feedback}
        </Text>
      )}
    </View>
  );
}
