import { LoginReq, LoginRes } from "@/core/entities/auth.entity";
import { endSession } from "@/infrastructure/auth/auth-session";
import type { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../storage/auth-storage";
import { tokenStorage } from "../storage/toke-storage";

async function saveSession(response: ApiEnvelope<LoginRes>) {
  await tokenStorage.setTokens(response.data.tokens);
  useAuthStore.getState().setAuthenticated();
}

export const useLogin = () => {
  return useMutation({
    mutationKey: ["mobile", "login"],
    mutationFn: (dto: LoginReq) => authService.mobileLogin(dto),
    onSuccess: saveSession,
  });
};

export const useLogout = () => {
  return useMutation({
    mutationKey: ["mobile", "logout"],
    mutationFn: async () => {
      const tokens = await tokenStorage.getTokens();

      await endSession();

      if (tokens) {
        await authService.mobileLogout({
          refreshToken: tokens.refreshToken,
        });
      }
    },
  });
};

export const useRegisterCitizen = () => {
  return useMutation({
    mutationKey: ["mobile", "register"],
    mutationFn: (dto: LoginReq) => authService.registerCitizen(dto),
    onSuccess: saveSession,
  });
};
