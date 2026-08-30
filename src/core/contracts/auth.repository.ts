import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import {
  LoginReq,
  LoginRes,
  LogoutReq,
  LogoutRes,
} from "../entities/auth.entity";

export interface AuthRepository {
  mobileLogin: (dto: LoginReq) => Promise<ApiEnvelope<LoginRes>>;
  mobileLogout: (dto: LogoutReq) => Promise<ApiEnvelope<LogoutRes>>;
}
