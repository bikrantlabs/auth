import type { Pool } from "pg";
import { UserRepositoryPort } from "../../../application/ports/outbound/user-repository.port";
import { UserAlreadyExistsError } from "../../../application/errors/index";
import { User } from "../../../domain/entities/user.entity";
import { Email } from "../../../domain/value-objects/email.vo";
import { UserMapper, type DbUser } from "./user.mapper";

// Column names match migrations/*_init.cjs (auth_users table).
const SELECT_USER =
  "SELECT id, email, password_hash AS password, is_email_verified AS email_verified, is_active FROM auth_users";

export class UserRepositoryImpl implements UserRepositoryPort {
  constructor(private readonly db: Pool) {}

  async createUser(user: User): Promise<void> {
    const { id, email, password, email_verified, is_active } =
      UserMapper.toDb(user);

    try {
      await this.db.query(
        "INSERT INTO auth_users (id, email, password_hash, is_email_verified, is_active) VALUES ($1, $2, $3, $4, $5)",
        [id, email, password, email_verified, is_active],
      );
    } catch (error) {
      // Two requests can both pass findByEmail before either inserts. The unique
      // index is the real guarantee; translate its violation rather than letting
      // it surface as an opaque 500.
      if ((error as { code?: string }).code === "23505") {
        throw new UserAlreadyExistsError(email);
      }
      throw error;
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    const result = await this.db.query<DbUser>(
      `${SELECT_USER} WHERE email = $1`,
      [email.value],
    );

    const row = result.rows[0];
    return row ? UserMapper.toUser(row) : null;
  }
}
