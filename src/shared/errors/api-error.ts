import axios from "axios";

type ApiErrorResponse = {
  message?: string | string[];
};

export const getApiErrorMessages = (error: unknown): string[] => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return ["Ocurrió un error inesperado. Inténtalo nuevamente."];
  }

  const { message } = error.response?.data ?? {};
  if (Array.isArray(message)) return message;
  if (typeof message === "string") return [message];

  return ["No pudimos procesar la solicitud. Inténtalo nuevamente."];
};
