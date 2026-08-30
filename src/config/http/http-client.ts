import {
  endSession,
  getSessionVersion,
} from "@/infrastructure/auth/auth-session";
import { tokenStorage } from "@/infrastructure/storage/toke-storage";
import { AuthErrorCode } from "@/shared/errors/auth-errors";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import { AuthTokens } from "@/shared/interfaces/auth-storage.interface";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
const PUBLIC_AUTH_ROUTES = [
  "/auth/mobile/login",
  "/auth/register",
  "/auth/mobile/refresh",
  "/auth/mobile/logout",
];

export const api: AxiosInstance = axios.create({
  baseURL,
});

const refreshApi: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
});

interface RefreshTokenRes {
  accessToken: string;
  refreshToken: string;
}

let refreshPromise: Promise<AuthTokens> | null = null;

async function refreshAccessToken(): Promise<AuthTokens> {
  const sessionVersion = getSessionVersion();
  const tokens = await tokenStorage.getTokens();
  if (!tokens) throw new Error("NO_REFRESH_TOKEN");

  const endPoint = "/auth/mobile/refresh";

  const { data } = await refreshApi.post<ApiEnvelope<RefreshTokenRes>>(
    endPoint,
    {
      refreshToken: tokens.refreshToken,
    },
  );

  const nextTokens = data.data;
  if (sessionVersion !== getSessionVersion()) {
    throw new Error("SESSION_ENDED");
  }

  await tokenStorage.setTokens(nextTokens);
  return nextTokens;
}

function getRefreshedTokens(): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const tokens = await tokenStorage.getTokens();
  if (tokens) config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  return config;
});

interface AuthErrorResponse {
  code: AuthErrorCode;
  message: string;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const isAuthErrorResponse = (data: unknown): data is AuthErrorResponse => {
  if (!data || typeof data !== "object") return false;

  const { code, message } = data as Record<string, unknown>;
  return (
    (code === "ACCESS_TOKEN_EXPIRED" || code === "ACCESS_TOKEN_INVALID") &&
    typeof message === "string"
  );
};

const isPublicAuthRoute = (url: string | undefined) => {
  const pathname = url?.split("?")[0];
  return PUBLIC_AUTH_ROUTES.includes(pathname ?? "");
};

api.interceptors.response.use(
  (res) => {
    return res;
  },
  async (error: AxiosError) => {
    const req = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !req ||
      isPublicAuthRoute(req.url) ||
      !isAuthErrorResponse(error.response.data)
    ) {
      return Promise.reject(error);
    }

    if (error.response.data.code === "ACCESS_TOKEN_INVALID") {
      await endSession();
      return Promise.reject(error);
    }

    if (req._retry) {
      await endSession();
      return Promise.reject(error);
    }

    req._retry = true;

    try {
      const tokens = await getRefreshedTokens();
      req.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(req);
    } catch (refreshError) {
      await endSession();
      return Promise.reject(refreshError);
    }
  },
);
