import { AuthStatus } from "@/shared/interfaces/auth-storage.interface";
import { create } from "zustand";

interface AuthStore {
  status: AuthStatus;
  setAuthenticated: () => void;
  setAnonymous: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: "anonymous",
  setAuthenticated: () => set({ status: "authenticated" }),
  setAnonymous: () => set({ status: "anonymous" }),
}));
