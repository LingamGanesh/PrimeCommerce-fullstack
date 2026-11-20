import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyHmacHex, isFulfilmentPaymentEligible, isValidRazorpayAmount } from "../utils/paymentSecurity.js";

test("verifies valid Razorpay HMAC signatures", () => {
  const body = JSON.stringify({ id: "evt_test", event: "payment.captured" });
  const secret = "webhook-test-secret";
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyHmacHex(body, signature, secret), true);
  assert.equal(verifyHmacHex(body + " ", signature, secret), false);
  assert.equal(verifyHmacHex(body, signature, "wrong-secret"), false);
});

test("rejects malformed HMAC signatures and missing secrets", () => {
  assert.equal(verifyHmacHex("payload", "not-a-signature", "secret"), false);
  assert.equal(verifyHmacHex("payload", "a".repeat(64), ""), false);
});

test("only captured online payments can enter fulfilment", () => {
  assert.equal(isFulfilmentPaymentEligible({ paymentMethod: "COD", payment_status: "pending" }), true);
  assert.equal(isFulfilmentPaymentEligible({ paymentMethod: "RAZORPAY", payment_status: "pending" }), false);
  assert.equal(isFulfilmentPaymentEligible({ paymentMethod: "RAZORPAY", payment_status: "authorized" }), false);
  assert.equal(isFulfilmentPaymentEligible({ paymentMethod: "RAZORPAY", payment_status: "paid" }), true);
  assert.equal(isFulfilmentPaymentEligible({ paymentMethod: "RAZORPAY", payment_status: "completed" }), true);
});

test("checks exact INR amount in paise", () => {
  assert.equal(isValidRazorpayAmount({ amount: 1299, currency: "INR" }, 1299), true);
  assert.equal(isValidRazorpayAmount({ amount: 1298, currency: "INR" }, 1299), false);
  assert.equal(isValidRazorpayAmount({ amount: 1299, currency: "USD" }, 1299), false);
  assert.equal(isValidRazorpayAmount(null, 1299), false);
});