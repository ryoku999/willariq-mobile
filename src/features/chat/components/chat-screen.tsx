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
import * as Crypto from "expo-crypto";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
  useReducedMotion,
} from "react-native-reanimated";

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
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<{
    scrollToEnd: (options?: { animated?: boolean }) => void;
  } | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [failedMessage, setFailedMessage] = useState<FailedMessage | null>(
    null,
  );
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const sessions = useChatSessions();
  const messages = useChatMessages(selectedSession?.id ?? null);
  const createSession = useCreateChatSession();
  const sendMessage = useSendChatMessage();
  const closeSession = useCloseChatSession();
  const job = useChatJob(pendingJobId);
  const items = messages.data?.pages.flatMap((page) => page.data.items) ?? [];
  const sessionClosed = isClosed(selectedSession);
  const isSending = createSession.isPending || sendMessage.isPending;

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (!drawerOpen) return false;
          setDrawerOpen(false);
          return true;
        },
      );
      return () => subscription.remove();
    }, [drawerOpen]),
  );

  useEffect(() => {
    if (!items.length) return;
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
  }, [items.length, pendingJobId]);

  useEffect(() => {
    const status = job.data?.data.status.toUpperCase();
    if (status === "COMPLETED" || status === "FAILED") {
      setPendingJobId(null);
      void messages.refetch();
    }
  }, [job.data?.data.status, messages.refetch]);

  const startNewChat = () => {
    setSelectedSession(null);
    setDraft("");
    setFailedMessage(null);
    setPendingJobId(null);
    setDrawerOpen(false);
  };

  const selectSession = (session: ChatSession) => {
    setSelectedSession(session);
    setFailedMessage(null);
    setPendingJobId(null);
    setDrawerOpen(false);
  };

  const submit = async (retry = false) => {
    const retryMessage = retry ? failedMessage : null;
    const content = (retryMessage?.content ?? draft).trim();
    if (!content || content.length > 4000 || isSending || sessionClosed) return;

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
    if (!selectedSession || sessionClosed) return;
    Alert.alert(
      "Cerrar conversación",
      "No podrás enviar más mensajes en esta conversación.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar",
          style: "destructive",
          onPress: () => {
            closeSession.mutate(selectedSession.id, {
              onSuccess: () => {
                setSelectedSession((current) =>
                  current
                    ? {
                        ...current,
                        status: "CLOSED",
                        closedAt: new Date().toISOString(),
                      }
                    : current,
                );
              },
            });
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="pt-safe flex-row items-center border-b border-gray-200 bg-white px-4 pb-3 dark:border-gray-800 dark:bg-gray-900">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a Inicio"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Feather
            name="chevron-left"
            size={24}
            color={isDark ? "#e5e7eb" : "#1f2937"}
          />
        </Pressable>
        <View className="flex-1 px-2">
          <Text
            numberOfLines={1}
            className="text-base font-bold text-gray-900 dark:text-white"
          >
            {selectedSession?.title ?? "Asistente municipal"}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Consultas municipales e incidencias
          </Text>
        </View>
        {selectedSession && !sessionClosed && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar conversación"
            onPress={confirmClose}
            disabled={closeSession.isPending}
            className="mr-1 h-11 w-11 items-center justify-center rounded-full disabled:opacity-50"
          >
            {closeSession.isPending ? (
              <ActivityIndicator color={isDark ? "#e5e7eb" : "#1f2937"} />
            ) : (
              <Feather
                name="archive"
                size={19}
                color={isDark ? "#e5e7eb" : "#1f2937"}
              />
            )}
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir historial de conversaciones"
          onPress={() => setDrawerOpen(true)}
          className="h-11 w-11 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950"
        >
          <Feather
            name="menu"
            size={20}
            color={isDark ? "#93c5fd" : "#2563eb"}
          />
        </Pressable>
      </View>

      <KeyboardChatScrollView
        ref={(node) => {
          scrollRef.current = node;
        }}
        keyboardLiftBehavior="whenAtEnd"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 112,
          flexGrow: 1,
        }}
        className="flex-1"
      >
        {!selectedSession ? (
          <WelcomeState onSuggestion={(content) => setDraft(content)} />
        ) : messages.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2563eb" />
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
                className="mb-5 self-center rounded-xl bg-gray-200 px-4 py-3 disabled:opacity-50 dark:bg-gray-800"
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
            {pendingJobId && (
              <View className="mb-4 self-start rounded-2xl bg-white px-4 py-3 dark:bg-gray-900">
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#2563eb" />
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
        style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      >
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={() => void submit()}
          disabled={isSending || sessionClosed}
          isSending={isSending}
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
  return (
    <View className="flex-1 justify-center pb-24">
      <View className="h-16 w-16 items-center justify-center rounded-3xl bg-blue-600">
        <Feather name="message-circle" size={30} color="white" />
      </View>
      <Text className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
        ¿En qué te ayudo?
      </Text>
      <Text className="mt-3 text-base leading-6 text-gray-600 dark:text-gray-300">
        Pregunta por servicios municipales o consulta una incidencia con su
        código de seguimiento.
      </Text>
      <View className="mt-8 gap-3">
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            accessibilityRole="button"
            onPress={() => onSuggestion(suggestion)}
            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <Text className="text-sm leading-5 font-medium text-gray-700 dark:text-gray-200">
              {suggestion}
            </Text>
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
  closed,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isSending: boolean;
  closed: boolean;
}) {
  const canSend = Boolean(value.trim()) && !disabled;
  return (
    <View className="pb-safe border-t border-gray-200 bg-white px-4 pt-3 dark:border-gray-800 dark:bg-gray-900">
      {closed && (
        <Text className="mb-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
          Esta conversación está cerrada.
        </Text>
      )}
      <View className="flex-row items-end rounded-3xl bg-gray-100 p-2 dark:bg-gray-800">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          placeholder={closed ? "Conversación cerrada" : "Escribe tu consulta"}
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={4000}
          className="max-h-28 flex-1 px-3 py-2 text-base text-gray-900 dark:text-white"
          accessibilityLabel="Escribe tu consulta para el asistente municipal"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar consulta"
          onPress={onSend}
          disabled={!canSend}
          className="h-11 w-11 items-center justify-center rounded-full bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          {isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="arrow-up" size={20} color="white" />
          )}
        </Pressable>
      </View>
      <Text className="mt-1 px-2 text-right text-[11px] text-gray-400">
        {value.length}/4000
      </Text>
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "USER";
  return (
    <View
      className={`mb-4 max-w-[88%] rounded-3xl px-4 py-3 ${isUser ? "self-end rounded-br-md bg-blue-600" : "self-start rounded-bl-md bg-white dark:bg-gray-900"}`}
    >
      <Text
        className={`text-base leading-6 ${isUser ? "text-white" : "text-gray-800 dark:text-gray-100"}`}
      >
        {message.content}
      </Text>
      {!isUser &&
        message.metadata?.sources &&
        message.metadata.sources.length > 0 && (
          <View className="mt-3 border-t border-gray-200 pt-2 dark:border-gray-700">
            <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              FUENTES
            </Text>
            {message.metadata.sources.map((source) => (
              <Text
                key={`${source.documentId}-${source.title}`}
                className="mt-1 text-xs text-blue-700 dark:text-blue-300"
              >
                {source.title}
              </Text>
            ))}
          </View>
        )}
      <Text
        className={`mt-2 text-[11px] ${isUser ? "text-blue-100" : "text-gray-400"}`}
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
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Feather name="wifi-off" size={30} color="#dc2626" />
      <Text className="mt-3 text-center text-gray-600 dark:text-gray-300">
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-3"
      >
        <Text className="font-bold text-white">Reintentar</Text>
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
  const duration = reducedMotion ? 0 : 220;
  return (
    <Animated.View
      entering={FadeIn.duration(duration)}
      exiting={FadeOut.duration(duration)}
      className="absolute inset-0 z-10 flex-row"
    >
      <Animated.View
        entering={SlideInLeft.duration(duration)}
        exiting={SlideOutLeft.duration(duration)}
        className="pt-safe w-[84%] max-w-96 bg-white dark:bg-gray-900"
      >
        <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Conversaciones
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar historial"
            onPress={onClose}
            className="h-11 w-11 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
          >
            <Feather name="x" size={20} color="#6b7280" />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onNew}
          className="mx-5 mt-5 min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3"
        >
          <Feather name="plus" size={18} color="white" />
          <Text className="font-bold text-white">Nueva conversación</Text>
        </Pressable>
        {sessions.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : sessions.isError ? (
          <InlineError
            message="No pudimos cargar tus conversaciones."
            onRetry={() => void sessions.refetch()}
          />
        ) : (
          <ScrollView className="flex-1 px-3 py-4">
            {items.length === 0 && (
              <Text className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                Aún no tienes conversaciones.
              </Text>
            )}
            {items.map((session) => (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                onPress={() => onSelect(session)}
                className={`mb-1 rounded-xl px-3 py-4 ${session.id === selectedId ? "bg-blue-50 dark:bg-blue-950" : ""}`}
              >
                <Text
                  numberOfLines={1}
                  className="font-semibold text-gray-800 dark:text-gray-100"
                >
                  {session.title}
                </Text>
                <Text className="mt-1 text-xs text-gray-400">
                  {formatDate(session.updatedAt)}
                </Text>
              </Pressable>
            ))}
            {sessions.hasNextPage && (
              <Pressable
                accessibilityRole="button"
                onPress={() => void sessions.fetchNextPage()}
                disabled={sessions.isFetchingNextPage}
                className="my-3 items-center rounded-xl bg-gray-100 px-4 py-3 dark:bg-gray-800"
              >
                <Text className="font-semibold text-blue-700 dark:text-blue-300">
                  {sessions.isFetchingNextPage ? "Cargando..." : "Cargar más"}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        )}
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar historial"
        onPress={onClose}
        className="flex-1 bg-black/40"
      />
    </Animated.View>
  );
}
