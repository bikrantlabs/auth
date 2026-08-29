import { Credential } from "../../entities/Credential";
import { User } from "../../entities/User";

export interface UserRepository {
  createUser(user: User, credential: Credential): Promise<void>;
  getUserByEmail(email: string): Promise<User | null>;
  findCredentialByUserId(userId: string): Promise<Credential | null>;
}
