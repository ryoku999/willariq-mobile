import { queryClient } from "@/config/query/query-client";
import { router } from "expo-router";
import { useAuthStore } from "../storage/auth-storage";
import { tokenStorage } from "../storage/toke-storage";

let sessionVersion = 0;
let endingSession: Promise<void> | null = null;

export const getSessionVersion = () => sessionVersion;

export const endSession = (): Promise<void> => {
  if (endingSession) return endingSession;

  sessionVersion += 1;
  endingSession = (async () => {
    await tokenStorage.clearTokens();
    useAuthStore.getState().setAnonymous();
    queryClient.clear();
    router.replace("/login");
  })().finally(() => {
    endingSession = null;
  });

  return endingSession;
};
