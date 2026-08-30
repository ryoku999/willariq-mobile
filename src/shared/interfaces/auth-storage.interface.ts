export type AuthStatus = "authenticated" | "anonymous" | "hydrating";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
