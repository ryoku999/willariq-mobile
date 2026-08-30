import { LoginReq } from "@/core/entities/auth.entity";
import { endSession } from "@/infrastructure/auth/auth-session";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../storage/auth-storage";
import { tokenStorage } from "../storage/toke-storage";

export const useLogin = () => {
  const { setAuthenticated } = useAuthStore();
  const { setTokens } = tokenStorage;

  return useMutation({
    mutationKey: ["mobile", "login"],
    mutationFn: (dto: LoginReq) => authService.mobileLogin(dto),
    onSuccess: async (data) => {
      await setTokens(data.data.tokens);
      setAuthenticated();
    },
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
