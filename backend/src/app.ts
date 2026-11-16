import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";

import apiRoutes from "./routes/index.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

// Security and request parsing.
app.use(helmet());
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  }),
);

// Global API limiter plus a much stricter one on credential endpoints.
const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: env.NODE_ENV === "production" ? 30 : 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." },
  },
});
app.use("/api/v1", apiLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/admin/auth", authLimiter);
app.use(express.json({ limit: "1mb" }));

// Root endpoint.
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Workflow Orchestration Engine API",
  });
});

// Versioned API.
app.use("/api/v1", apiRoutes);

// Register these after all normal routes.
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;