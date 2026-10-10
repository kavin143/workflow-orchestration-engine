import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connects to MongoDB using validated application configuration.
 * The HTTP server must not start accepting requests until this succeeds.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 20,
      minPoolSize: 2,
      autoIndex: env.NODE_ENV !== "production",
    });

    console.info("MongoDB connection established successfully.");
  } catch {
    // Never print the URI because it may contain database credentials.
    console.error("Failed to establish the initial MongoDB connection.");
    throw new Error("Initial MongoDB connection failed.");
  }
}


/**
 * Registers connection lifecycle listeners.
 *
 * Call this once during application startup, before connecting.
 * These events help operators identify database connectivity changes.
 */
export function registerDatabaseListeners(): void {
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection was disconnected.");
  });

  mongoose.connection.on("reconnected", () => {
    console.info("MongoDB connection was restored.");
  });

  mongoose.connection.on("error", () => {
    // Avoid logging the raw error object because it may contain
    // connection details depending on the driver and error type.
    console.error("A MongoDB connection error occurred.");
  });
}

/**
 * Closes the MongoDB connection gracefully.
 *
 * Useful when the application receives a shutdown signal.
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.info("MongoDB connection closed.");
}

