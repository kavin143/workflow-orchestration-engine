import { env } from "./config/env.js";
import app from "./app.js";
import {
  connectDatabase,
  registerDatabaseListeners,
  disconnectDatabase,
} from "./config/database.js";

const PORT = env.PORT;

async function startServer(): Promise<void> {
  registerDatabaseListeners();

  // Validate configuration first, then establish the database connection.
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.info(`HTTP server listening on port ${PORT}.`);
  });

  // Stop accepting requests before closing the database connection.
  const shutdown = (signal: string): void => {
    console.info(`Received ${signal}. Shutting down gracefully.`);

    server.close((error) => {
      void (async () => {
        try {
          await disconnectDatabase();

          if (error) {
            console.error("HTTP server shutdown failed.");
            process.exitCode = 1;
          }
        } catch {
          console.error("Database shutdown failed.");
          process.exitCode = 1;
        }
      })();
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch(() => {
  console.error(
    "Application startup failed. Check environment configuration and database availability.",
  );
  process.exitCode = 1;
});