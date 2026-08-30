// login request
export interface LoginReq {
  dni: string;
  password: string;
}

// login  response
export type UserRole = "CITIZEN";

export interface LoginRes {
  success: boolean;
  path: string;
  data: Data;
}

export interface Data {
  tokens: Tokens;
  user: User;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  dni: string;
  email: string | null;
  emailVerifiedAt: string | null;
  firstName: string;
  id: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: string;
}

// logout request
export interface LogoutReq {
  refreshToken: string;
}

// logout response
export interface LogoutRes {
  success: boolean;
  path: string;
  data: {
    message: string;
  };
}
