
import type { RequestHandler } from "express";
import { adminUserService } from "../services/admin-user.service.js";

export const listAdminUsers: RequestHandler = async (req, res, next) => {
  try {
    const result = await adminUserService.list(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getAdminUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await adminUserService.getById(getUserId(req.params.id));

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const updateAdminUserStatus: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const user = await adminUserService.updateStatus(
      getUserId(req.params.id),
      req.body,
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteAdminUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await adminUserService.remove(getUserId(req.params.id));

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    next(error);
  }
};

function getUserId(id: string | string[] | undefined): string {
  return typeof id === "string" ? id : "";
}
