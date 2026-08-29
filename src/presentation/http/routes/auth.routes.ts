import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import {
  RegisterUserBody,
  registerUserSchema,
} from "../contracts/register-contract";

const authRouter = express.Router();

authRouter.post<{}, {}, RegisterUserBody>(
  "/register",
  validateRequest(registerUserSchema), // Intercepts and validates the schema
  (req, res) => {
    // At this point, req.body matches your schema and is fully safe to use
    console.log(req.body);
    res.status(201).json({ message: "User passed validation successfully" });
  },
);

export { authRouter };
