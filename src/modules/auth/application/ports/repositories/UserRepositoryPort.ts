import { User } from '../../../domain/entities/User.js';
import { Email } from '../../../domain/value-objects/Email.js';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface UserRepositoryPort {
  createUser(user: User): Promise<void>;
  findByEmail(email: Email): Promise<User | null>;
}
