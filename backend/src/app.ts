import express from "express";
import cors from "cors";
import helmet from "helmet";

import apiRoutes from "./routes/index.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

// Security and request parsing.
app.use(helmet());
app.use(cors());
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