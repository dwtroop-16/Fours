import type { RuleOperator } from "../types";

export function conditionMet(
  operator: RuleOperator,
  value: number,
  threshold: number,
): boolean {
  switch (operator) {
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
    case "eq":
      return value === threshold;
  }
}
