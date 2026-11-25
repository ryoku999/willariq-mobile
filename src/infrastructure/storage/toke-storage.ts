import {
  ACCES_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "@/shared/constants/auth-storage.contant";
import { AuthTokens } from "@/shared/interfaces/auth-storage.interface";
import * as SecureStore from "expo-secure-store";

let pendingWrite = Promise.resolve();

function writeTokens(operation: () => Promise<void>) {
  const result = pendingWrite.then(operation);
  pendingWrite = result.catch(() => undefined);
  return result;
}

export const tokenStorage = {
  async getTokens(): Promise<AuthTokens | null> {
    await pendingWrite;
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCES_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },

  setTokens(tokens: AuthTokens, isCurrent = () => true): Promise<void> {
    return writeTokens(async () => {
      if (!isCurrent()) throw new Error("SESSION_ENDED");
      await Promise.all([
        SecureStore.setItemAsync(ACCES_TOKEN_KEY, tokens.accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
      ]);
    });
  },

  clearTokens(): Promise<void> {
    return writeTokens(async () => {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCES_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    });
  },
};
