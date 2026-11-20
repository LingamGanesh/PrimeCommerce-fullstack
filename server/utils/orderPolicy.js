export function canCustomerCancelOrder(order) {
  return Boolean(order && order.delivery_status === "processing" && order.inventoryReleased !== true);
}

export function canRequestFullRazorpayRefund(order) {
  return Boolean(order && order.paymentMethod === "RAZORPAY" && order.payment_status === "paid" && order.payment_id && order.refund_status === "not_required");
}