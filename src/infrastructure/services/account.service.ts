import { api } from "@/config/http/http-client";

export const accountService = {
  update: (data: { firstName: string; lastName: string; phone: string }) =>
    api.patch("/users/me", data),
  setEmail: (email: string, currentPassword: string) =>
    api.put("/users/me/email", { email, currentPassword }),
  requestVerification: () =>
    api.post("/users/me/email/verification-requests", {}),
  confirmEmail: (token: string) =>
    api.post("/users/email-verifications/confirm", { token }),
  forgot: (email: string) => api.post("/auth/password/forgot", { email }),
  reset: (token: string, newPassword: string) =>
    api.post("/auth/password/reset", { token, newPassword }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch("/users/me/password", { currentPassword, newPassword }),
  logoutAll: () => api.post("/auth/logout-all", {}),
};
