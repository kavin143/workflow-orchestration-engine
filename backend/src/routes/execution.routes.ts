
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getExecutionController,
  getExecutionSummaryController,
  listExecutionsController,
  rerunExecutionController,
} from "../controllers/execution.controller.js";

const executionRouter = Router();

executionRouter.use(requireAuth);

// List executions with workflow/status filters and pagination.
executionRouter.get("/", listExecutionsController);

// Dashboard counts + 7-day breakdown. Must be registered before "/:id".
executionRouter.get("/summary", getExecutionSummaryController);

// Get a single execution, including its node runs and logs.
executionRouter.get("/:id", getExecutionController);

// Re-run a workflow using the same graph snapshot as a previous execution.
executionRouter.post("/:id/rerun", rerunExecutionController);

export default executionRouter;
