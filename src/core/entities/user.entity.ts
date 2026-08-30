export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string | null;
  emailVerifiedAt: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
