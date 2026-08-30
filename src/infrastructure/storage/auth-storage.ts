import { AuthStatus } from "@/shared/interfaces/auth-storage.interface";
import { create } from "zustand";
import { tokenStorage } from "./toke-storage";

interface AuthStore {
  status: AuthStatus;
  setAuthenticated: () => void;
  setAnonymous: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: "hydrating",
  setAuthenticated: () => set({ status: "authenticated" }),
  setAnonymous: () => set({ status: "anonymous" }),
  hydrate: async () => {
    try {
      const tokens = await tokenStorage.getTokens();
      set({ status: tokens ? "authenticated" : "anonymous" });
    } catch {
      set({ status: "anonymous" });
    }
  },
}));
