import "reflect-metadata";
import { describe, it, expect, beforeEach } from "vitest";
import { container } from "tsyringe";
import { LOGGER } from "@/shared/logging/logger.port";
import {
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from "@/modules/auth/application/ports/tokens";
import { RegisterUserUseCase } from "@/modules/auth/application/RegisterUserUseCase";
import { RegisterUserCommand } from "@/modules/auth/application/RegisterUserCommand";
import { Email } from "@/modules/auth/domain/value-objects/Email";
import { PlainPassword } from "@/modules/auth/domain/value-objects/UserPassword";
import { InMemoryUserRepository } from "@/modules/auth/adapters/InMemoryUserRepository";
import { ScryptPasswordHasher } from "@/modules/auth/adapters/ScryptPasswordHasherImpl";
import { UserAlreadyExistsError } from "@/modules/auth/application/errors";
import type { LoggerPort } from "@/shared/logging/logger.port";

const silentLogger: LoggerPort = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

describe("RegisterUserUseCase", () => {
  beforeEach(() => {
    container.reset();
    container.registerInstance(LOGGER, silentLogger);
    container.register(USER_REPOSITORY, { useClass: InMemoryUserRepository });
    container.register(PASSWORD_HASHER, { useClass: ScryptPasswordHasher });
    container.register(RegisterUserUseCase, {
      useFactory: (c) =>
        new RegisterUserUseCase(
          c.resolve(USER_REPOSITORY),
          c.resolve(PASSWORD_HASHER),
          c.resolve(LOGGER),
        ),
    });
  });

  it("registers a new user", async () => {
    const useCase = container.resolve(RegisterUserUseCase);
    const result = await useCase.execute(
      new RegisterUserCommand(
        new Email("learner@example.com"),
        new PlainPassword("supersecret123"),
      ),
    );
    expect(result.userId).toBeTypeOf("string");
    expect(result.message).toMatch(/registered/i);
  });

  it("rejects duplicate email", async () => {
    const useCase = container.resolve(RegisterUserUseCase);
    const cmd = () =>
      new RegisterUserCommand(
        new Email("dup@example.com"),
        new PlainPassword("supersecret123"),
      );
    await useCase.execute(cmd());
    await expect(useCase.execute(cmd())).rejects.toThrow(UserAlreadyExistsError);
  });
});
