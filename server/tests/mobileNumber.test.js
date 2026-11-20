import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMobileNumber, isValidIndianMobileNumber } from "../utils/mobileNumber.js";

test("mobile normalization preserves leading zeroes as strings", () => {
  assert.equal(normalizeMobileNumber("0 98765-43210"), "09876543210");
  assert.equal(normalizeMobileNumber(null), "");
});

test("Indian mobile validation uses the normalized ten-digit value", () => {
  assert.equal(isValidIndianMobileNumber("98765 43210"), true);
  assert.equal(isValidIndianMobileNumber("58765 43210"), false);
  assert.equal(isValidIndianMobileNumber("987654321"), false);
});