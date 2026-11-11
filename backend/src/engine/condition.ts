
import type { ExecutionContext } from "./types.js";
import { resolvePath } from "./template.js";

const OPERATORS = ["==", "!=", ">=", "<=", ">", "<"] as const;

/**
 * Evaluates a condition expression of the form:
 *   {{path}} OPERATOR value
 * e.g. {{start.status}} == "200", {{transform.count}} > 5
 *
 * This is a hand-written, restricted parser — not eval()/Function() — so a
 * malicious or malformed expression can never execute arbitrary code.
 */
export function evaluateCondition(
  expression: string,
  context: ExecutionContext,
): boolean {
  const trimmed = expression.trim();

  const operator = OPERATORS.find((candidate) =>
    trimmed.includes(candidate),
  );

  if (!operator) {
    throw new Error(
      `Condition expression must use one of: ${OPERATORS.join(", ")}`,
    );
  }

  const operatorIndex = trimmed.indexOf(operator);
  const leftRaw = trimmed.slice(0, operatorIndex).trim();
  const rightRaw = trimmed.slice(operatorIndex + operator.length).trim();

  const pathMatch = /^\{\{\s*([\w.]+)\s*\}\}$/.exec(leftRaw);

  if (!pathMatch) {
    throw new Error(
      'Condition expression must start with a "{{path}}" placeholder',
    );
  }

  const leftValue = resolvePath(context, pathMatch[1]!);
  const rightValue = parseLiteral(rightRaw);

  return compare(leftValue, rightValue, operator);
}

function parseLiteral(raw: string): unknown {
  const quoted = /^"(.*)"$|^'(.*)'$/.exec(raw);

  if (quoted) {
    return quoted[1] ?? quoted[2] ?? "";
  }

  if (raw === "true") return true;
  if (raw === "false") return false;

  const asNumber = Number(raw);

  return Number.isNaN(asNumber) ? raw : asNumber;
}

function compare(
  left: unknown,
  right: unknown,
  operator: (typeof OPERATORS)[number],
): boolean {
  switch (operator) {
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case ">":
      return Number(left) > Number(right);
    case "<":
      return Number(left) < Number(right);
    case ">=":
      return Number(left) >= Number(right);
    case "<=":
      return Number(left) <= Number(right);
    default:
      return false;
  }
}
