import { queryClient } from "@/config/query/query-client";
import { LoginReq } from "@/core/entities/auth.entity";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { authService } from "../services/auth.sevice";
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
  const { setAnonymous } = useAuthStore();

  return useMutation({
    mutationKey: ["mobile", "logout"],
    mutationFn: async () => {
      const tokens = await tokenStorage.getTokens();
      try {
        if (tokens) {
          await authService.mobileLogout({
            refreshToken: tokens.refreshToken,
          });
        }
      } finally {
        await tokenStorage.clearTokens();
      }
    },
    onSettled: () => {
      setAnonymous();
      queryClient.clear();
      router.replace("/login");
    },
  });
};
