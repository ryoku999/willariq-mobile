export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dni: string;
  phone: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
