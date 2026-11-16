import type { RequestHandler } from "express";

import { adminLogin } from "../services/admin-auth.service.js";

export const adminLoginController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const result = await adminLogin(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};
