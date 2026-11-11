
import { Router } from "express";

import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import workflowRoutes from "./workflow.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/workflows", workflowRoutes);
router.use("/admin", adminRoutes);

export default router;
