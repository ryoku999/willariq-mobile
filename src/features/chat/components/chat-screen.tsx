import type { ChatMessage, ChatSession } from "@/core/entities/chat.entity";
import {
  useChatJob,
  useChatMessages,
  useChatSessions,
  useCloseChatSession,
  useCreateChatSession,
  useSendChatMessage,
} from "@/infrastructure/hooks/use-chat";
import { getApiErrorMessages } from "@/shared/errors/api-error";
import { formatDate } from "@/shared/utils/format-date";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import {
  KeyboardChatScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, {
  SlideInLeft,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FailedMessage = {
  clientRequestId: string;
  content: string;
  createdAt: string;
  sessionId: string | null;
};

const SUGGESTIONS = [
  "¿Cuáles son las funciones del serenazgo municipal?",
  "¿Cuál es el estado de mi incidencia MDSJ-2026-000123?",
];

function isClosed(session: ChatSession | null) {
  return (
    session?.status.toUpperCase() === "CLOSED" || Boolean(session?.closedAt)
  );
}

function chatErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 429
  ) {
    return "Hay muchas consultas en este momento. Espera un momento antes de reintentar.";
  }
  return getApiErrorMessages(error)[0];
}

export default function ChatScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const headerIconColor = isDark ? "#e2e8f0" : "#16283e";
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<{
    scrollToEnd: (options?: { animated?: boolean }) => void;
  } | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerHeight, setComposerHeight] = useState(112);
  const [draft, setDraft] = useState("");
  const [failedMessage, setFailedMessage] = useState<FailedMessage | null>(
    null,
  );
  const [jobError, setJobError] = useState("");
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const sessions = useChatSessions();
  const messages = useChatMessages(selectedSession?.id ?? null);
  const createSession = useCreateChatSession();
  const sendMessage = useSendChatMessage();
  const closeSession = useCloseChatSession();
  const job = useChatJob(pendingJobId);
  // The API paginates newest first; reverse the entire loaded conversation.
  const newestFirst =
    messages.data?.pages.flatMap((page) => page.data.items) ?? [];
  const items = [
    ...new Map(newestFirst.map((message) => [message.id, message])).values(),
  ].reverse();
  const latestMessageId = items.at(-1)?.id;
  const sessionClosed = isClosed(selectedSession);
  const closing =
    closeSession.isPending && closeSession.variables === selectedSession?.id;
  const isSending = createSession.isPending || sendMessage.isPending;

  useEffect(() => {
    if (!latestMessageId) return;
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
  }, [latestMessageId, pendingJobId]);

  useEffect(() => {
    if (sessionClosed) {
      setPendingJobId(null);
      setFailedMessage(null);
      setJobError("");
      return;
    }
    const status = job.data?.data.status.toUpperCase();
    if (
      status === "COMPLETED" ||
      status === "FAILED" ||
      status === "CANCELLED"
    ) {
      if (status === "FAILED") {
        setJobError(
          job.data?.data.errorSummary === "RATE_LIMITED"
            ? "El servicio alcanzó su límite de solicitudes. Intenta más tarde."
            : "No se pudo generar la respuesta. Intenta de nuevo.",
        );
      }
      setPendingJobId(null);
      void messages.refetch();
    }
  }, [
    sessionClosed,
    job.data?.data.status,
    job.data?.data.errorSummary,
    messages.refetch,
  ]);

  const startNewChat = () => {
    setJobError("");
    setSelectedSession(null);
    setDraft("");
    setFailedMessage(null);
    setPendingJobId(null);
    setDrawerOpen(false);
  };

  const selectSession = (session: ChatSession) => {
    setJobError("");
    setSelectedSession(session);
    setFailedMessage(null);
    setPendingJobId(null);
    setDrawerOpen(false);
  };

  const submit = async (retry = false) => {
    const retryMessage = retry ? failedMessage : null;
    const content = (retryMessage?.content ?? draft).trim();
    if (
      !content ||
      content.length > 4000 ||
      isSending ||
      sessionClosed ||
      closing
    )
      return;

    if (pendingJobId) return;
    setJobError("");
    const clientRequestId =
      retryMessage?.clientRequestId ?? Crypto.randomUUID();
    let session = selectedSession;
    try {
      if (!session) {
        const result = await createSession.mutateAsync({
          title: content.slice(0, 60),
        });
        session = result.data;
        setSelectedSession(session);
      }

      if (!retry) setDraft("");
      setFailedMessage(null);
      const result = await sendMessage.mutateAsync({
        sessionId: session.id,
        clientRequestId,
        content,
      });
      if (result.data.aiJobId && !result.data.assistantMessage) {
        setPendingJobId(result.data.aiJobId);
      }
      void messages.refetch();
    } catch {
      setFailedMessage({
        clientRequestId,
        content,
        createdAt: new Date().toISOString(),
        sessionId: session?.id ?? null,
      });
    }
  };

  const confirmClose = () => {
    if (!selectedSession || sessionClosed || closing) return;
    const sessionId = selectedSession.id;
    Alert.alert(
      "Cerrar conversación",
      "No podrás enviar más mensajes en esta conversación.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar",
          style: "destructive",
          onPress: () => {
            closeSession.mutate(sessionId, {
              onSuccess: (closed) => {
                setSelectedSession((current) =>
                  current?.id === sessionId ? closed : current,
                );
                void messages.refetch();
              },
              onError: (error) => {
                Alert.alert(
                  "No se pudo cerrar la conversación",
                  chatErrorMessage(error),
                );
              },
            });
          },
        },
      ],
    );
  };

  return (
    <View className="pt-safe flex-1 bg-[#f5f7fa] dark:bg-gray-950">
      <View className="flex-row items-center gap-2 border-b border-slate-200 px-4 pt-5 pb-3 dark:border-slate-800">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a Inicio"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          className="h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white active:opacity-70 dark:border-slate-600 dark:bg-slate-800"
        >
          <Feather name="arrow-left" size={21} color={headerIconColor} />
        </Pressable>
        <View className="min-w-0 flex-1 px-1">
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            className="text-base font-bold text-[#16283e] dark:text-white"
          >
            {selectedSession?.title ?? "Asistente municipal"}
          </Text>
          {selectedSession && (
            <Text
              numberOfLines={1}
              className="text-xs text-slate-600 dark:text-slate-300"
            >
              {sessionClosed ? "Conversación cerrada" : "Asistente municipal"}
            </Text>
          )}
        </View>
        {selectedSession && !sessionClosed && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar conversación"
            onPress={confirmClose}
            disabled={closeSession.isPending}
            className="h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white active:opacity-70 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800"
          >
            {closeSession.isPending ? (
              <ActivityIndicator color={headerIconColor} />
            ) : (
              <Feather name="archive" size={19} color={headerIconColor} />
            )}
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir historial de conversaciones"
          accessibilityState={{ expanded: drawerOpen }}
          onPress={() => setDrawerOpen(true)}
          className="h-11 w-11 items-center justify-center rounded-xl border border-[#a7e0d1] bg-[#d8f7ed] active:opacity-75 dark:border-[#3c6d64] dark:bg-[#193a35]"
        >
          <Feather
            name="menu"
            size={20}
            color={isDark ? "#a7f3d0" : "#155348"}
          />
        </Pressable>
      </View>

      <KeyboardChatScrollView
        ref={(node) => {
          scrollRef.current = node;
        }}
        keyboardLiftBehavior="whenAtEnd"
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: composerHeight + 12,
          flexGrow: 1,
        }}
        className="flex-1"
      >
        {!selectedSession ? (
          <WelcomeState onSuggestion={(content) => setDraft(content)} />
        ) : messages.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={isDark ? "#93c5fd" : "#1d4ed8"} />
            <Text className="mt-3 text-gray-500 dark:text-gray-400">
              Cargando conversación...
            </Text>
          </View>
        ) : messages.isError ? (
          <InlineError
            onRetry={() => void messages.refetch()}
            message={chatErrorMessage(messages.error)}
          />
        ) : (
          <>
            {messages.hasNextPage && (
              <Pressable
                accessibilityRole="button"
                onPress={() => void messages.fetchNextPage()}
                disabled={messages.isFetchingNextPage}
                className="mb-5 self-center rounded-xl border border-slate-300 bg-white px-4 py-3 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800"
              >
                <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {messages.isFetchingNextPage
                    ? "Cargando mensajes..."
                    : "Cargar mensajes anteriores"}
                </Text>
              </Pressable>
            )}
            {items.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {failedMessage &&
              failedMessage.sessionId === selectedSession.id && (
                <FailedMessageBubble
                  message={failedMessage}
                  onRetry={() => void submit(true)}
                  isRetrying={isSending}
                />
              )}
            {!!jobError && (
              <Text className="text-red-600 dark:text-red-400">{jobError}</Text>
            )}
            {pendingJobId && (
              <View className="mb-4 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator
                    size="small"
                    color={isDark ? "#93c5fd" : "#1d4ed8"}
                  />
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    Preparando respuesta municipal...
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </KeyboardChatScrollView>

      <KeyboardStickyView
        onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      >
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={() => void submit()}
          disabled={isSending || sessionClosed || closing}
          isSending={isSending}
          waitingForReply={Boolean(pendingJobId)}
          closed={sessionClosed}
        />
      </KeyboardStickyView>

      {drawerOpen && (
        <ChatHistoryDrawer
          sessions={sessions}
          selectedId={selectedSession?.id ?? null}
          onClose={() => setDrawerOpen(false)}
          onNew={startNewChat}
          onSelect={selectSession}
          reducedMotion={reducedMotion}
        />
      )}
    </View>
  );
}

function WelcomeState({
  onSuggestion,
}: {
  onSuggestion: (content: string) => void;
}) {
  const isDark = useColorScheme() === "dark";
  const suggestionIconColor = isDark ? "#bfdbfe" : "#1d4ed8";
  return (
    <View className="mx-auto w-full max-w-xl flex-1 justify-center gap-5">
      <View className="gap-3 rounded-3xl border border-[#2e4a65] bg-[#162b43] p-5 dark:border-[#52718f]">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#c4f2e2]">
          <MaterialCommunityIcons
            name="robot-outline"
            size={28}
            color="#155348"
          />
        </View>
        <Text
          accessibilityRole="header"
          className="text-2xl font-bold text-white"
        >
          ¿En qué te ayudo?
        </Text>
        <Text className="text-base leading-6 text-slate-200">
          Pregunta por servicios municipales o consulta una incidencia con su
          código de seguimiento.
        </Text>
      </View>
      <View className="gap-2.5">
        <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Consultas sugeridas
        </Text>
        {SUGGESTIONS.map((suggestion, index) => (
          <Pressable
            key={suggestion}
            accessibilityRole="button"
            onPress={() => onSuggestion(suggestion)}
            className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 active:opacity-75 dark:border-slate-700 dark:bg-slate-900"
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800">
              <Feather
                name={index === 0 ? "message-square" : "search"}
                size={17}
                color={suggestionIconColor}
              />
            </View>
            <Text className="flex-1 text-sm leading-5 font-medium text-slate-800 dark:text-slate-200">
              {suggestion}
            </Text>
            <Feather
              name="arrow-up-right"
              size={16}
              color={suggestionIconColor}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Composer({
  value,
  onChangeText,
  onSend,
  disabled,
  isSending,
  waitingForReply,
  closed,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isSending: boolean;
  waitingForReply: boolean;
  closed: boolean;
}) {
  const isDark = useColorScheme() === "dark";
  const canSend = Boolean(value.trim()) && !disabled && !waitingForReply;
  const sendIconColor = canSend
    ? isDark
      ? "#155348"
      : "#fff"
    : isDark
      ? "#cbd5e1"
      : "#475569";
  return (
    <View className="pb-safe border-t border-slate-200 bg-white px-4 pt-3 dark:border-slate-700 dark:bg-slate-900">
      {closed && (
        <Text className="mb-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
          Esta conversación está cerrada.
        </Text>
      )}
      <View className="flex-row items-end rounded-3xl border border-slate-300 bg-slate-50 p-2 dark:border-slate-500 dark:bg-slate-800">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          placeholder={closed ? "Conversación cerrada" : "Escribe tu consulta"}
          placeholderTextColor={isDark ? "#cbd5e1" : "#64748b"}
          multiline
          maxLength={4000}
          className="max-h-28 min-h-11 flex-1 px-3 py-2.5 text-base text-slate-900 dark:text-white"
          accessibilityLabel="Escribe tu consulta para el asistente municipal"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar consulta"
          onPress={onSend}
          disabled={!canSend}
          className={`h-11 w-11 items-center justify-center rounded-2xl ${canSend ? "bg-[#162b43] active:opacity-75 dark:bg-[#c4f2e2]" : "bg-slate-200 dark:bg-slate-700"}`}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={sendIconColor} />
          ) : (
            <Feather name="arrow-up" size={20} color={sendIconColor} />
          )}
        </Pressable>
      </View>
      <Text className="mt-1 px-2 pb-2 text-right text-[11px] text-slate-600 dark:text-slate-300">
        {value.length}/4000
      </Text>
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "USER";
  return (
    <View
      className={`mb-4 max-w-[88%] rounded-3xl border px-4 py-3 ${isUser ? "self-end rounded-br-md border-[#2e4a65] bg-[#162b43] dark:border-[#52718f]" : "self-start rounded-bl-md border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
    >
      <Text
        className={`text-base leading-6 ${isUser ? "text-white" : "text-gray-800 dark:text-gray-100"}`}
      >
        {message.content}
      </Text>
      <Text
        className={`mt-2 text-[11px] ${isUser ? "text-slate-200" : "text-slate-600 dark:text-slate-300"}`}
      >
        {formatDate(message.createdAt)}
      </Text>
    </View>
  );
}

function FailedMessageBubble({
  message,
  onRetry,
  isRetrying,
}: {
  message: FailedMessage;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <View className="mb-4 self-end rounded-3xl rounded-br-md bg-red-50 px-4 py-3 dark:bg-red-950">
      <Text className="text-base leading-6 text-gray-800 dark:text-gray-100">
        {message.content}
      </Text>
      <Text className="mt-2 text-xs text-red-700 dark:text-red-300">
        No se pudo enviar.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        disabled={isRetrying}
        className="mt-2 self-start rounded-lg bg-red-100 px-3 py-2 disabled:opacity-50 dark:bg-red-900"
      >
        <Text className="text-xs font-bold text-red-700 dark:text-red-200">
          {isRetrying ? "Reintentando..." : "Reintentar"}
        </Text>
      </Pressable>
    </View>
  );
}

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const isDark = useColorScheme() === "dark";
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Feather
        name="wifi-off"
        size={30}
        color={isDark ? "#fca5a5" : "#b91c1c"}
      />
      <Text className="mt-3 text-center text-gray-600 dark:text-gray-300">
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        className="mt-4 rounded-xl bg-[#162b43] px-4 py-3 dark:bg-[#c4f2e2]"
      >
        <Text className="font-bold text-white dark:text-[#155348]">
          Reintentar
        </Text>
      </Pressable>
    </View>
  );
}

function ChatHistoryDrawer({
  sessions,
  selectedId,
  onClose,
  onNew,
  onSelect,
  reducedMotion,
}: {
  sessions: ReturnType<typeof useChatSessions>;
  selectedId: string | null;
  onClose: () => void;
  onNew: () => void;
  onSelect: (session: ChatSession) => void;
  reducedMotion: boolean;
}) {
  const items = sessions.data?.pages.flatMap((page) => page.data.items) ?? [];
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";
  const controlColor = isDark ? "#e2e8f0" : "#16283e";
  const accent = isDark ? "#93c5fd" : "#1d4ed8";
  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType={reducedMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <View
        className="flex-1"
        style={{ marginTop: insets.top, marginBottom: insets.bottom }}
      >
        <Pressable
          accessible={false}
          onPress={onClose}
          className="absolute inset-0 bg-slate-950/30 dark:bg-black/45"
        />
        <Animated.View
          entering={reducedMotion ? undefined : SlideInLeft.duration(230)}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={{
            marginTop: 12,
            marginBottom: 12,
            marginLeft: Math.max(12, insets.left),
            width: "86%",
            maxWidth: 352,
            flexShrink: 1,
          }}
        >
          <View className="shrink overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900">
            <View className="gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
              <View className="flex-row items-center justify-between gap-2">
                <Text
                  accessibilityRole="header"
                  className="flex-1 text-lg font-bold text-slate-900 dark:text-white"
                >
                  Conversaciones
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar historial"
                  onPress={onClose}
                  className="h-11 w-11 items-center justify-center rounded-xl bg-slate-100 active:opacity-70 dark:bg-slate-700"
                >
                  <Feather name="x" size={20} color={controlColor} />
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nueva conversación"
                onPress={onNew}
                className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-[#c4f2e2] px-3 py-2 active:opacity-75"
              >
                <Feather name="plus" size={18} color="#155348" />
                <Text className="font-bold text-[#155348]">
                  Nueva conversación
                </Text>
              </Pressable>
            </View>
            {sessions.isPending ? (
              <View className="items-center justify-center p-6">
                <ActivityIndicator color={accent} />
              </View>
            ) : sessions.isError ? (
              <View className="py-5">
                <InlineError
                  message="No pudimos cargar tus conversaciones."
                  onRetry={() => void sessions.refetch()}
                />
              </View>
            ) : (
              <ScrollView
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ padding: 12, gap: 8 }}
              >
                {items.length === 0 && (
                  <Text className="px-3 py-4 text-center text-slate-600 dark:text-slate-300">
                    Aún no tienes conversaciones.
                  </Text>
                )}
                {items.map((session) => (
                  <Pressable
                    key={session.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: session.id === selectedId }}
                    onPress={() => onSelect(session)}
                    className={`flex-row items-center gap-3 rounded-2xl border p-3 active:opacity-70 ${session.id === selectedId ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"}`}
                  >
                    <Feather name="message-square" size={18} color={accent} />
                    <View className="min-w-0 flex-1">
                      <Text
                        numberOfLines={1}
                        className="font-semibold text-slate-900 dark:text-white"
                      >
                        {session.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="mt-1 text-xs text-slate-600 dark:text-slate-300"
                      >
                        {formatDate(session.updatedAt)}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={17}
                      color={controlColor}
                    />
                  </Pressable>
                ))}
                {sessions.hasNextPage && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void sessions.fetchNextPage()}
                    disabled={sessions.isFetchingNextPage}
                    className="items-center rounded-xl bg-slate-100 px-4 py-3 disabled:opacity-60 dark:bg-slate-800"
                  >
                    <Text className="font-semibold text-blue-700 dark:text-blue-300">
                      {sessions.isFetchingNextPage
                        ? "Cargando..."
                        : "Cargar más"}
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
