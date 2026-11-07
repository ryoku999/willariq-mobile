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
  "/auth/password/forgot",
  "/auth/password/reset",
  "/users/email-verifications/confirm",
];

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
});

const refreshApi: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
});

interface RefreshTokenRes {
  accessToken: string;
  refreshToken: string;
}

let refresh: { version: number; promise: Promise<AuthTokens> } | null = null;

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

  await tokenStorage.setTokens(
    nextTokens,
    () => sessionVersion === getSessionVersion(),
  );
  return nextTokens;
}

function getRefreshedTokens(): Promise<AuthTokens> {
  const version = getSessionVersion();
  if (refresh?.version === version) return refresh.promise;
  const promise = refreshAccessToken().finally(() => {
    if (refresh?.promise === promise) refresh = null;
  });
  refresh = { version, promise };
  return promise;
}

api.interceptors.request.use(async (config) => {
  const request = config as RetryableRequestConfig;
  request.sessionVersion ??= getSessionVersion();
  const tokens = await tokenStorage.getTokens();
  if (request.sessionVersion !== getSessionVersion())
    throw new Error("SESSION_ENDED");
  if (tokens && !isPublicAuthRoute(config.url))
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  return config;
});

interface AuthErrorResponse {
  code: AuthErrorCode;
  message: string;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  sessionVersion?: number;
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
      req.sessionVersion !== getSessionVersion() ||
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
      const current = await tokenStorage.getTokens();
      if (req.sessionVersion !== getSessionVersion())
        return Promise.reject(error);
      const tokens =
        current && req.headers.Authorization !== `Bearer ${current.accessToken}`
          ? current
          : await getRefreshedTokens();
      if (req.sessionVersion !== getSessionVersion())
        return Promise.reject(error);
      req.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(req);
    } catch (refreshError) {
      if (
        req.sessionVersion === getSessionVersion() &&
        axios.isAxiosError(refreshError) &&
        refreshError.response?.status === 401
      ) {
        await endSession();
      }
      return Promise.reject(refreshError);
    }
  },
);
