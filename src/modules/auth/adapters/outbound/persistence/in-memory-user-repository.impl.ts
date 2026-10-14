import { UserRepositoryPort } from "../../../application/ports/outbound/user-repository.port";
import { UserAlreadyExistsError } from "../../../application/errors/index";
import { User } from "../../../domain/entities/user.entity";
import { Email } from "../../../domain/value-objects/email.vo";

export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly usersByEmail = new Map<string, User>();

  async createUser(user: User): Promise<void> {
    // The database will enforce this with a unique constraint. Keeping the check
    // here means duplicate-email behaviour holds before that constraint exists.
    if (this.usersByEmail.has(user.email.value)) {
      throw new UserAlreadyExistsError(user.email.value);
    }

    this.usersByEmail.set(user.email.value, user);
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.usersByEmail.get(email.value) ?? null;
  }
}
