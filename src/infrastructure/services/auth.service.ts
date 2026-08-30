import { api } from "@/config/http/http-client";
import { AuthRepository } from "@/core/contracts/auth.repository";
import {
  LoginReq,
  LoginRes,
  LogoutReq,
  LogoutRes,
} from "@/core/entities/auth.entity";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import { AxiosInstance } from "axios";

class AuthService implements AuthRepository {
  private readonly prefix = "/auth";
  private readonly http: AxiosInstance = api;

  async mobileLogin(dto: LoginReq): Promise<ApiEnvelope<LoginRes>> {
    const { data } = await this.http.post<ApiEnvelope<LoginRes>>(
      `${this.prefix}/mobile/login`,
      dto,
    );
    return data;
  }

  async mobileLogout(dto: LogoutReq): Promise<ApiEnvelope<LogoutRes>> {
    const { data } = await this.http.post<ApiEnvelope<LogoutRes>>(
      `${this.prefix}/mobile/logout`,
      dto,
    );
    return data;
  }
}

export const authService = new AuthService();
