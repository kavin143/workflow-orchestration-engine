
import type { RequestHandler } from "express";
import { executionService } from "../services/execution.service.js";

export const getExecutionSummaryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = req.auth;

    if (!auth) {
      res.status(401).json({
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
      return;
    }

    const summary = await executionService.summary(auth.tenantId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const listExecutionsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = req.auth;

    if (!auth) {
      res.status(401).json({
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
      return;
    }

    const result = await executionService.list(auth.tenantId, req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getExecutionController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = req.auth;

    if (!auth) {
      res.status(401).json({
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
      return;
    }

    const execution = await executionService.getById(
      auth.tenantId,
      getExecutionId(req.params.id),
    );

    res.status(200).json({
      success: true,
      data: execution,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const rerunExecutionController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = req.auth;

    if (!auth) {
      res.status(401).json({
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
      return;
    }

    const execution = await executionService.rerun(
      auth.tenantId,
      auth.userId,
      getExecutionId(req.params.id),
    );

    res.status(201).json({
      success: true,
      data: { executionId: execution._id.toString() },
    });
  } catch (error: unknown) {
    next(error);
  }
};

function getExecutionId(id: string | string[] | undefined): string {
  return typeof id === "string" ? id : "";
}
