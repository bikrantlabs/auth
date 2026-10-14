import express, { Router } from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "@/config/env";
import { logger } from "@/shared/logging/pino.logger";
import { errorHandler } from "@/shared/http/error-handler";
import { authRouter } from "@/modules/auth/presentation/auth.routes";

export function createApp() {
  const app = express();

  // Security Headers
  app.use(helmet());
  app.use(express.json());

  // CORS
  // NOTE: `credentials: true` + a wildcard origin is rejected by browsers, so
  // reflect the request origin when no explicit allowlist is configured.
  const corsOrigin = env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN;
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true, // allow cookies
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Request logging
  app.use((req, _res, next) => {
    logger.debug(
      `Incoming Request: ${req.method} ${req.url}`,
      `HTTP ${req.ip}`,
    );
    next();
  });

  app.use(
    `${env.API_PREFIX}/`,
    Router().get("/health", (_req, res) => {
      logger.info("Health Check", "HTTP");
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    }),
  );

  app.use(`${env.API_PREFIX}/auth`, authRouter);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });

  app.use(errorHandler);
  return app;
}

