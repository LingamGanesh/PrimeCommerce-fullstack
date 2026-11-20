import test from "node:test";
import assert from "node:assert/strict";
import { canCustomerCancelOrder, canRequestFullRazorpayRefund } from "../utils/orderPolicy.js";

test("customer cancellation is limited to processing orders with reserved inventory", () => {
  assert.equal(canCustomerCancelOrder({ delivery_status: "processing", inventoryReleased: false }), true);
  assert.equal(canCustomerCancelOrder({ delivery_status: "picking", inventoryReleased: false }), false);
  assert.equal(canCustomerCancelOrder({ delivery_status: "processing", inventoryReleased: true }), false);
});

test("only captured paid Razorpay orders with no previous refund can request a full refund", () => {
  const eligible = { paymentMethod: "RAZORPAY", payment_status: "paid", payment_id: "pay_123", refund_status: "not_required" };
  assert.equal(canRequestFullRazorpayRefund(eligible), true);
  assert.equal(canRequestFullRazorpayRefund({ ...eligible, payment_status: "authorized" }), false);
  assert.equal(canRequestFullRazorpayRefund({ ...eligible, refund_status: "failed" }), false);
  assert.equal(canRequestFullRazorpayRefund({ ...eligible, payment_id: "" }), false);
});