import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface UserRepositoryPort {
  createUser(user: User): Promise<void>;
  findByEmail(email: Email): Promise<User | null>;
}
