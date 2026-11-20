import crypto from "node:crypto";

export function verifyHmacHex(payload, signature, secret) {
  if (!secret || typeof payload !== "string" && !Buffer.isBuffer(payload) || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function isFulfilmentPaymentEligible(order) {
  if (!order) return false;
  return order.paymentMethod !== "RAZORPAY" || ["paid", "completed"].includes(order.payment_status);
}

export function isValidRazorpayAmount(entity, expectedAmountPaise) {
  return Boolean(entity && Number.isInteger(Number(entity.amount)) && Number(entity.amount) === expectedAmountPaise && entity.currency === "INR");
}