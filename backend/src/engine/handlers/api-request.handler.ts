
import type { ApiRequestNodeConfig, ExecutionContext, WorkflowNode } from "../types.js";
import { renderTemplate } from "../template.js";
import type { HandlerResult } from "./start.handler.js";

export async function run(
  node: WorkflowNode,
  context: ExecutionContext,
): Promise<HandlerResult> {
  const config = node.config as ApiRequestNodeConfig;

  const url = renderTemplate(config.url, context);
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(config.headers ?? {})) {
    headers[key] = renderTemplate(value, context);
  }

  const hasBody = config.body !== undefined && config.method !== "GET";

  if (hasBody && headers["Content-Type"] === undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: config.method,
    headers,
    ...(hasBody && { body: renderTemplate(config.body ?? "", context) }),
  });

  const text = await response.text();
  let parsedBody: unknown = text;

  try {
    parsedBody = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response bodies are kept as plain text.
  }

  if (!response.ok) {
    throw new Error(
      `API request to "${url}" failed with status ${response.status}`,
    );
  }

  return {
    output: {
      status: response.status,
      body: parsedBody,
    },
  };
}
