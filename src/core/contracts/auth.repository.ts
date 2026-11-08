import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import {
  LoginReq,
  LoginRes,
  LogoutReq,
  LogoutRes,
  UserCreateReq,
  UserCreateRes,
} from "../entities/auth.entity";

export interface AuthRepository {
  mobileLogin: (dto: LoginReq) => Promise<ApiEnvelope<LoginRes>>;
  mobileLogout: (dto: LogoutReq) => Promise<ApiEnvelope<LogoutRes>>;
  createUser: (dto: UserCreateReq) => Promise<ApiEnvelope<UserCreateRes>>;
}
