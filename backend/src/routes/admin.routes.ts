
import { Router } from "express";

import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { adminLoginSchema } from "../validators/admin-auth.validator.js";
import { updateUserStatusSchema } from "../validators/admin-user.validator.js";
import { adminLoginController } from "../controllers/admin-auth.controller.js";
import {
  deleteAdminUser,
  getAdminUser,
  listAdminUsers,
  updateAdminUserStatus,
} from "../controllers/admin-user.controller.js";

const router = Router();

/**
 * POST /api/v1/admin/auth/login
 *
 * Public login for platform admins. Independent of tenant authentication.
 */
router.post(
  "/auth/login",
  validateBody(adminLoginSchema),
  adminLoginController,
);

// Every route below requires a valid admin access token.
router.use(requireAdminAuth);

// List users across every tenant, with search, filters, and pagination.
router.get("/users", listAdminUsers);

// Get a single user by ID.
router.get("/users/:id", getAdminUser);

// Enable or disable a user account.
router.patch(
  "/users/:id/status",
  validateBody(updateUserStatusSchema),
  updateAdminUserStatus,
);

// Permanently delete a user account.
router.delete("/users/:id", deleteAdminUser);

export default router;
