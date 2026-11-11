
import type { ExecutionContext } from "./types.js";

/**
 * Resolves a dotted path (e.g. "start.status") against the execution
 * context accumulated so far. Returns undefined if any segment is missing.
 */
export function resolvePath(
  context: ExecutionContext,
  path: string,
): unknown {
  const segments = path.trim().split(".");
  let current: unknown = context;

  for (const segment of segments) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

/**
 * Replaces every {{path}} placeholder in `input` with the resolved value
 * from the execution context (stringified). Unresolved placeholders are
 * replaced with an empty string.
 */
export function renderTemplate(
  input: string,
  context: ExecutionContext,
): string {
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const value = resolvePath(context, path);

    if (value === undefined || value === null) {
      return "";
    }

    return typeof value === "string" ? value : JSON.stringify(value);
  });
}
