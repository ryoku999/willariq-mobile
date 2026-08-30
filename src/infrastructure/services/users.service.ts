import { api } from "@/config/http/http-client";
import { UserRepository } from "@/core/contracts/user.repository";
import { UserProfile } from "@/core/entities/user.entity";
import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import { AxiosInstance } from "axios";

class UsersService implements UserRepository {
  private readonly prefix = "/users";
  private readonly http: AxiosInstance = api;

  async me(): Promise<ApiEnvelope<UserProfile>> {
    const { data } = await this.http.get<ApiEnvelope<UserProfile>>(
      `${this.prefix}/me`,
    );
    return data;
  }
}

export const usersService = new UsersService();
