import {
  ChatJob,
  ChatPage,
  ChatMessage,
  ChatSession,
  CreateChatSessionRequest,
  SendChatMessageRequest,
  SendChatMessageResult,
} from "@/core/entities/chat.entity";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";

export interface ChatRepository {
  createSession(
    request: CreateChatSessionRequest,
  ): Promise<ApiEnvelope<ChatSession>>;
  listSessions(page: number): Promise<ApiEnvelope<ChatPage<ChatSession>>>;
  getSession(id: string): Promise<ApiEnvelope<ChatSession>>;
  listMessages(
    sessionId: string,
    page: number,
  ): Promise<ApiEnvelope<ChatPage<ChatMessage>>>;
  sendMessage(
    request: SendChatMessageRequest,
  ): Promise<ApiEnvelope<SendChatMessageResult>>;
  getJob(id: string): Promise<ApiEnvelope<ChatJob>>;
  closeSession(id: string): Promise<void>;
}
