import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProductPublication } from "../utils/catalogPublication.js";

test("new products are published and active by default", () => {
  assert.deepEqual(normalizeProductPublication(), {
    publish: true,
    isActive: true
  });
});

test("admin can create a hidden product without exposing it to customers", () => {
  assert.deepEqual(normalizeProductPublication(false), {
    publish: false,
    isActive: false
  });
});

test("publication state must be an explicit boolean", () => {
  assert.throws(() => normalizeProductPublication("false"), {
    name: "TypeError",
    message: "Publish must be true or false"
  });
});
