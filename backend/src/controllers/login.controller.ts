import type { RequestHandler } from "express";

import { loginUser } from "../services/login.service.js";

export const loginController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const result = await loginUser(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};