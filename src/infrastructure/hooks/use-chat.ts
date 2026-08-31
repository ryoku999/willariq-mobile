import { queryClient } from "@/config/query/query-client";
import {
  ChatMessage,
  ChatPage,
  CreateChatSessionRequest,
  SendChatMessageRequest,
} from "@/core/entities/chat.entity";
import { chatService } from "@/infrastructure/services/chat.service";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

export const chatKeys = {
  sessions: ["chat", "sessions"] as const,
  session: (id: string) => ["chat", "sessions", id] as const,
  messages: (id: string) => ["chat", "sessions", id, "messages"] as const,
  job: (id: string) => ["chat", "jobs", id] as const,
};

export function useChatSessions() {
  return useInfiniteQuery({
    queryKey: chatKeys.sessions,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => chatService.listSessions(pageParam),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
  });
}

export function useChatMessages(sessionId: string | null) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(sessionId ?? ""),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      chatService.listMessages(sessionId as string, pageParam),
    enabled: Boolean(sessionId),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
  });
}

export function useChatJob(jobId: string | null) {
  return useQuery({
    queryKey: chatKeys.job(jobId ?? ""),
    queryFn: () => chatService.getJob(jobId as string),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.data.status.toUpperCase() ?? "";
      return status === "COMPLETED" || status === "FAILED" ? false : 2_000;
    },
  });
}

export function useCreateChatSession() {
  return useMutation({
    mutationFn: (request: CreateChatSessionRequest) =>
      chatService.createSession(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.sessions });
    },
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: (request: SendChatMessageRequest) =>
      chatService.sendMessage(request),
    onSuccess: (response, request) => {
      const assistant = response.data.assistantMessage;
      if (assistant) {
        queryClient.setQueryData<
          InfiniteData<ApiEnvelope<ChatPage<ChatMessage>>>
        >(chatKeys.messages(request.sessionId), (current) => {
          if (!current) return current;
          const lastPage = current.pages.at(-1);
          if (
            !lastPage ||
            current.pages.some((page) =>
              page.data.items.some((item) => item.id === assistant.id),
            )
          ) {
            return current;
          }
          return {
            ...current,
            pages: [
              ...current.pages.slice(0, -1),
              {
                ...lastPage,
                data: {
                  ...lastPage.data,
                  items: [...lastPage.data.items, assistant],
                  pagination: {
                    ...lastPage.data.pagination,
                    total: lastPage.data.pagination.total + 1,
                  },
                },
              },
            ],
          };
        });
      }
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(request.sessionId),
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.sessions });
    },
  });
}

export function useCloseChatSession() {
  return useMutation({
    mutationFn: (sessionId: string) => chatService.closeSession(sessionId),
    onSuccess: (_, sessionId) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.session(sessionId),
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.sessions });
    },
  });
}
