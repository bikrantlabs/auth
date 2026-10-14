import { User } from '../domain/entities/User.js';
import { Email } from '../domain/value-objects/Email.js';
import { PasswordHash } from '../domain/value-objects/UserPassword.js';

export type DbUser = {
  id: string;
  email: string;
  password: string;
  email_verified: boolean;
  is_active: boolean;
};

export class UserMapper {
  static toDb(user: User): DbUser {
    return {
      id: user.id,
      email: user.email.value,
      password: user.password.value,
      email_verified: user.emailVerified,
      is_active: user.isActive,
    };
  }

  static toUser(dbUser: DbUser): User {
    const { id, email, password, email_verified, is_active } = dbUser;
    const _email = new Email(email);
    const _password = new PasswordHash(password);

    return User.reconstitute(id, _email, _password, email_verified, is_active);
  }
}
