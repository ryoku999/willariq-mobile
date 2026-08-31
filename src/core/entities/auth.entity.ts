// login request
export interface LoginReq {
  dni: string;
  password: string;
}

// login  response
export type UserRole = "CITIZEN";

export interface LoginRes {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: {
    dni: string;
    email: string | null;
    emailVerifiedAt: string | null;
    firstName: string;
    id: string;
    lastName: string;
    phone: string;
    role: UserRole;
    status: string;
  };
}

// logout request
export interface LogoutReq {
  refreshToken: string;
}

// logout response
export interface LogoutRes {
  message: string;
}

// user create request
export interface UserCreateReq {
  firstName: string;
  dni: string;
  phone: string;
  password: string;
  lastName: string | null;
}

export interface UserCreateRes {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  dni: string;
  email: string | null;
  emailVerifiedAt: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
