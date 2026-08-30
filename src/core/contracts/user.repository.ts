import { ApiEnvelope } from "@/shared/interfaces/api-response.interface";
import { UserProfile } from "../entities/user.entity";

export interface UserRepository {
  me: () => Promise<ApiEnvelope<UserProfile>>;
}
