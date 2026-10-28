import { Router } from "express";

const router = Router();

/**
 * Basic application health check.
 *
 * GET /api/v1/health
 */
router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

export default router;