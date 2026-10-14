import { Router } from "express";
import { validateBody } from "@/shared/http/validate-request";
import { registerSchema } from "./register.contract";
import { registerHandler } from "./register.controller";

const router = Router();

router.post("/register", validateBody(registerSchema), registerHandler);

// Placeholder so the module has a versioned entrypoint as it grows:
// login, refresh, verify-email, forgot/reset-password attach here.
router.get("/_ping", (_req, res) => {
  res.json({ success: true, data: { module: "auth", status: "wired" } });
});

export const authRouter = router;
