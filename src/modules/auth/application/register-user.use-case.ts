import { User } from "../domain/entities/user.entity";
import { UserRepositoryPort } from "./ports/outbound/user-repository.port";
import { PasswordHasher } from "./ports/outbound/password-hasher.port";
import { UserAlreadyExistsError } from "./errors/index";
import { RegisterUserCommand } from "./register-user.command";
import { PasswordHash } from "../domain/value-objects/user-password.vo";
import type { LoggerPort } from "@/shared/logging/logger.port";
import { AuthEventPort } from "./ports/outbound/auth-event.port";

// We can also make this usecase a interface that is implemented by a service.
export class RegisterUserUseCase {
  private readonly userRepository: UserRepositoryPort;
  private readonly passwordHasher: PasswordHasher;
  private readonly logger: LoggerPort;
  private readonly authEvents: AuthEventPort;

  constructor(
    userRepository: UserRepositoryPort,
    passwordHasher: PasswordHasher,
    logger: LoggerPort,
    authEvents: AuthEventPort,
  ) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.logger = logger;
    this.authEvents = authEvents;
  }

  async execute(command: RegisterUserCommand): Promise<RegisterUserOutput> {
    // Check if user exists
    const user = await this.userRepository.findByEmail(command.email);

    if (user) {
      this.logger.warn(
        "Registration rejected: email already registered",
        "RegisterUserUseCase",
      );
      throw new UserAlreadyExistsError(command.email.value);
    }

    // Hash the password
    const hash = await this.passwordHasher.hash(command.password.value);

    // Construct passwordhash from the hasher
    const hashedPassword = new PasswordHash(hash);

    const newUser = User.instantiate(command.email, hashedPassword);

    await this.userRepository.createUser(newUser);

    this.logger.info(`User registered: ${newUser.id}`, "RegisterUserUseCase");

    // Emit the user registered event
    this.authEvents.emitUserRegistered({
      userId: newUser.id,
      email: newUser.email.value,
      occuredAt: new Date(),
    });

    return {
      userId: newUser.id,
      message: "User registered successfully.",
    };
  }
}

type RegisterUserOutput = {
  userId: string;
  message: string;
};
