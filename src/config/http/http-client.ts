import { tokenStorage } from "@/infrastructure/storage/toke-storage";
import { AuthErrorCode } from "@/shared/errors/auth-errors";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import axios, { AxiosError, AxiosInstance } from "axios";

const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
const PUBLIC_AUTH_ROUTES = [
  "/auth/mobile/login",
  "/auth/register",
  "/auth/mobile/refresh",
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

let refreshPromise: Promise<string> | null = null;

async function refreshAccesToken(): Promise<string> {
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
  await tokenStorage.setTokens(nextTokens);
  return nextTokens.accessToken;
}

api.interceptors.request.use(async (config) => {
  const tokens = await tokenStorage.getTokens();
  if (tokens) config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  return config;
});

interface Res401 {
  code: AuthErrorCode;
  message: string;
}

api.interceptors.response.use(
  (res) => {
    return res;
  },
  async (error: AxiosError) => {
    const req = error.config;

    const isPublicAuthRoutes = PUBLIC_AUTH_ROUTES.some((route) =>
      req?.url?.endsWith(route),
    );

    if (error.response?.status !== 401 || !req || isPublicAuthRoutes) {
      return Promise.reject(error);
    }
  },
);
