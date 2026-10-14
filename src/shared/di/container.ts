import "reflect-metadata";
import { container } from "tsyringe";
import type { Pool } from "pg";
import type { RedisClientType } from "redis";
import { LOGGER } from "@/shared/logging/logger.port";
import { PinoLogger, logger } from "@/shared/logging/pino.logger";
import { PG_POOL, pool } from "@/shared/database/postgres";
import { REDIS_CLIENT, getRedis } from "@/shared/cache/redis";
import type { UserRepositoryPort } from "@/modules/auth/application/ports/repositories/UserRepositoryPort";
import type { PasswordHasher } from "@/modules/auth/application/ports/services/PasswordHasher";
import {
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from "@/modules/auth/application/ports/tokens";
import { UserRepositoryImpl } from "@/modules/auth/adapters/UserRepositoryImpl";
import { ScryptPasswordHasher } from "@/modules/auth/adapters/ScryptPasswordHasherImpl";
import { RegisterUserUseCase } from "@/modules/auth/application/RegisterUserUseCase";

/**
 * Composition root. The ONLY place that knows concrete classes.
 * Domain + application depend on ports; this file wires ports → adapters.
 * Call once at startup (server.ts) and in tests (with overrides).
 */
export function registerDependencies(): void {
  // Shared
  container.registerInstance(LOGGER, logger);
  container.registerInstance(PG_POOL, pool);
  container.register<RedisClientType>(REDIS_CLIENT, {
    useFactory: () => getRedis(),
  });

  // Auth module — production adapters
  container.register<PasswordHasher>(PASSWORD_HASHER, {
    useClass: ScryptPasswordHasher,
  });
  // Factory so the pg Pool instance is injected, not constructed by tsyringe
  container.register<UserRepositoryPort>(USER_REPOSITORY, {
    useFactory: (c) => new UserRepositoryImpl(c.resolve<Pool>(PG_POOL)),
  });

  // Use cases
  container.register(RegisterUserUseCase, {
    useFactory: (c) =>
      new RegisterUserUseCase(
        c.resolve<UserRepositoryPort>(USER_REPOSITORY),
        c.resolve<PasswordHasher>(PASSWORD_HASHER),
        c.resolve(LOGGER),
      ),
  });

  // Ensure the concrete classes themselves are resolvable
  container.register(ScryptPasswordHasher, { useClass: ScryptPasswordHasher });
  container.register(PinoLogger, { useValue: logger });
}

export { container };
