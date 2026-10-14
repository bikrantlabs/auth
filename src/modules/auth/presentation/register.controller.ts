import type { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { Email } from "@/modules/auth/domain/value-objects/email.vo";
import { PlainPassword } from "@/modules/auth/domain/value-objects/user-password.vo";
import { RegisterUserCommand } from "@/modules/auth/application/register-user.command";
import { RegisterUserUseCase } from "@/modules/auth/application/register-user.use-case";
import type { RegisterBody } from "./register.contract";

/**
 * Presentation adapter: HTTP → application.
 * Builds value objects + command (validation lives in the domain),
 * resolves the use case from the container, returns 201.
 */
export async function registerHandler(
  req: Request<unknown, unknown, RegisterBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const command = new RegisterUserCommand(
      new Email(req.body.email),
      new PlainPassword(req.body.password),
    );
    const useCase = container.resolve(RegisterUserUseCase);
    const result = await useCase.execute(command);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
