
import type { RequestHandler } from "express";
import { workflowService } from "../services/workflow.service.js";
import { executionService } from "../services/execution.service.js";

export const getWorkflowSummary: RequestHandler = async (req, res, next) => {
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

    const summary = await workflowService.summary(auth.tenantId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const createWorkflow: RequestHandler = async (req, res, next) => {
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

    const workflow = await workflowService.create(
      auth.tenantId,
      auth.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: workflow,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const listWorkflows: RequestHandler = async (req, res, next) => {
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

    const result = await workflowService.list(auth.tenantId, req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getWorkflow: RequestHandler = async (req, res, next) => {
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

    const workflow = await workflowService.getById(
      auth.tenantId,
      getWorkflowId(req.params.id),
    );

    res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const updateWorkflow: RequestHandler = async (req, res, next) => {
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

    const workflow = await workflowService.update(
      auth.tenantId,
      getWorkflowId(req.params.id),
      req.body,
    );

    res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const archiveWorkflow: RequestHandler = async (req, res, next) => {
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

    const workflow = await workflowService.archive(
      auth.tenantId,
      getWorkflowId(req.params.id),
    );

    res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const saveWorkflowDefinition: RequestHandler = async (
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

    const workflow = await workflowService.saveDefinition(
      auth.tenantId,
      getWorkflowId(req.params.id),
      req.body,
    );

    res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const validateWorkflowDefinition: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const result = await workflowService.validateDefinition(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const runWorkflow: RequestHandler = async (req, res, next) => {
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

    const execution = await executionService.run(
      auth.tenantId,
      auth.userId,
      getWorkflowId(req.params.id),
    );

    res.status(201).json({
      success: true,
      data: { executionId: execution._id.toString() },
    });
  } catch (error: unknown) {
    next(error);
  }
};

function getWorkflowId(id: string | string[] | undefined): string {
  return typeof id === "string" ? id : "";
}
