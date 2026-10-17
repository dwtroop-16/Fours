import assert from "node:assert/strict";
import { conditionMet } from "./compare";

assert.equal(conditionMet("gt", 60, 54), true);
assert.equal(conditionMet("gt", 50, 54), false);
assert.equal(conditionMet("lt", -25, -20), true);
assert.equal(conditionMet("gte", 40, 40), true);
assert.equal(conditionMet("lte", 39.9, 40), true);
assert.equal(conditionMet("eq", 1, 1), true);

console.log("rules compare tests passed");
