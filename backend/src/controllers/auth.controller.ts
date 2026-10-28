
import type { RequestHandler } from "express";

import { registerUser } from "../services/auth.service.js";

/**
 * Handles public tenant registration.
 *
 * The service validates input, hashes the password, creates the tenant
 * and first user, and returns safe response objects.
 */
export const registerController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const result = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};
