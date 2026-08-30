import {
  LoginReq,
  LoginRes,
  LogoutReq,
  LogoutRes,
} from "../entities/auth.entity";

export interface AuthRepository {
  mobileLogin: (dto: LoginReq) => Promise<LoginRes>;
  mobileLogout: (dto: LogoutReq) => Promise<LogoutRes>;
}
