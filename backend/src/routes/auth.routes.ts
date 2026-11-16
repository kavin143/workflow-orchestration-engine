
import { Router } from "express";

import { registerController } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { registerSchema } from "../validators/auth.validator.js";
import { loginController } from "../controllers/login.controller.js";
import { loginSchema } from "../validators/login.validator.js";

const router = Router();

/**
 * POST /api/v1/auth/register
 *
 * Validates the request body before passing it to the controller.
 */
router.post(
  "/register",
  validateBody(registerSchema),
  registerController,
);

router.post(
  "/login",
  validateBody(loginSchema),
  loginController,
);

export default router;
