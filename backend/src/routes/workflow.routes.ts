
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  createWorkflowSchema,
  updateWorkflowSchema,
} from "../validators/workflow.validator.js";
import {
  archiveWorkflow,
  createWorkflow,
  getWorkflow,
  listWorkflows,
  updateWorkflow,
} from "../controllers/workflow.controller.js";

const workflowRouter = Router();

// All workflow operations require authentication.
workflowRouter.use(requireAuth);

// Create a workflow.
workflowRouter.post(
  "/",
  validateBody(createWorkflowSchema),
  createWorkflow,
);

// List workflows with search, filters, and pagination.
workflowRouter.get("/", listWorkflows);

// Get a workflow by ID.
workflowRouter.get("/:id", getWorkflow);

// Update a workflow.
workflowRouter.patch(
  "/:id",
  validateBody(updateWorkflowSchema),
  updateWorkflow,
);

// Archive a workflow instead of permanently deleting it.
workflowRouter.delete("/:id", archiveWorkflow);

export default workflowRouter;