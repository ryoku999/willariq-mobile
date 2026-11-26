export type ChatRole = "USER" | "ASSISTANT" | "SYSTEM";

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  incidentId?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type ChatPage<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type CreateChatSessionRequest = {
  title: string;
};

export type SendChatMessageRequest = {
  sessionId: string;
  clientRequestId: string;
  content: string;
};

export type SendChatMessageResult = {
  userMessageId: string;
  assistantMessage: ChatMessage | null;
  aiJobId: string | null;
};

export type ChatJob = {
  id: string;
  status: string;
  provider: string | null;
  errorSummary: string | null;
};
