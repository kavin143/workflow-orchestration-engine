
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  createWorkflowSchema,
  updateWorkflowSchema,
} from "../validators/workflow.validator.js";
import { workflowDefinitionSchema } from "../validators/workflow-definition.validator.js";
import {
  archiveWorkflow,
  createWorkflow,
  getWorkflow,
  getWorkflowSummary,
  listWorkflows,
  runWorkflow,
  saveWorkflowDefinition,
  updateWorkflow,
  validateWorkflowDefinition,
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

// Dashboard counts by status. Must be registered before "/:id".
workflowRouter.get("/summary", getWorkflowSummary);

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

// Save the visual builder's node/edge graph for a workflow.
workflowRouter.put(
  "/:id/definition",
  validateBody(workflowDefinitionSchema),
  saveWorkflowDefinition,
);

// Validate a node/edge graph without saving it (used by the "Validate" button).
workflowRouter.post(
  "/:id/validate",
  validateBody(workflowDefinitionSchema),
  validateWorkflowDefinition,
);

// Run a workflow: creates an execution and queues its Start node.
workflowRouter.post("/:id/run", runWorkflow);

export default workflowRouter;