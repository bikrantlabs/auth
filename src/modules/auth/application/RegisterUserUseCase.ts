import { User } from '../domain/entities/User.js';
import { UserRepositoryPort } from './ports/repositories/UserRepositoryPort.js';
import { PasswordHasher } from './ports/services/PasswordHasher.js';
import { UserAlreadyExistsError } from './errors/index.js';
import { RegisterUserCommand } from './RegisterUserCommand.js';
import { PasswordHash } from '../domain/value-objects/UserPassword.js';
import type { LoggerPort } from '@/shared/logging/logger.port';

// We can also make this usecase a interface that is implemented by a service.
export class RegisterUserUseCase {
  private readonly userRepository: UserRepositoryPort;
  private readonly passwordHasher: PasswordHasher;
  private readonly logger: LoggerPort;

  constructor(
    userRepository: UserRepositoryPort,
    passwordHasher: PasswordHasher,
    logger: LoggerPort,
  ) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.logger = logger;
  }

  async execute(command: RegisterUserCommand): Promise<RegisterUserOutput> {
    // Check if user exists
    const user = await this.userRepository.findByEmail(command.email);

    if (user) {
      this.logger.warn(
        'Registration rejected: email already registered',
        'RegisterUserUseCase',
      );
      throw new UserAlreadyExistsError(command.email.value);
    }

    // Hash the password
    const hash = await this.passwordHasher.hash(command.password.value);

    // Construct passwordhash from the hasher
    const hashedPassword = new PasswordHash(hash);

    const newUser = User.instantiate(command.email, hashedPassword);

    await this.userRepository.createUser(newUser);

    this.logger.info(
      `User registered: ${newUser.id}`,
      'RegisterUserUseCase',
    );

    return {
      userId: newUser.id,
      message: 'User registered successfully.',
    };
  }
}

type RegisterUserOutput = {
  userId: string;
  message: string;
};
