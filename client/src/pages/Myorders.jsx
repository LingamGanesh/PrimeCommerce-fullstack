import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

const activeTrackingStatuses = ["rider_assigned", "picked_up", "out_for_delivery"];
const deliverySteps = [{ id: "processing", label: "Confirmed" }, { id: "picking", label: "Picking" }, { id: "packed", label: "Packed" }, { id: "rider_assigned", label: "Rider assigned" }, { id: "picked_up", label: "Picked up" }, { id: "out_for_delivery", label: "On the way" }, { id: "delivered", label: "Delivered" }];

export default function Myorders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState("");
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState("");
  const [retryingOrder, setRetryingOrder] = useState("");

  useEffect(() => {
    Axios.get("/api/v1/orders/mine")
      .then(response => setOrders(response.data?.data || []))
      .catch(error => toast.error(error.response?.data?.message || "Unable to load orders"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!trackingOrderId) return undefined;
    let mounted = true;
    const loadTracking = async () => {
      try {
        const response = await Axios.get(`/api/v1/orders/${trackingOrderId}/tracking`);
        if (mounted) setTracking(response.data?.data || null);
      } catch (error) {
        if (mounted) toast.error(error.response?.data?.message || "Unable to refresh tracking");
      } finally {
        if (mounted) setTrackingLoading(false);
      }
    };
    setTrackingLoading(true);
    loadTracking();
    const interval = window.setInterval(loadTracking, 10000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [trackingOrderId]);

  const generateDeliveryOtp = async (orderId) => {
    setOtpLoading(true);
    setDeliveryOtp(null);
    try {
      const response = await Axios.post(`/api/v1/orders/${orderId}/delivery-otp`);
      setDeliveryOtp({ orderId, ...response.data.data });
      toast.success("Delivery OTP generated. Share it with your rider only when they arrive.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to generate delivery OTP");
    } finally { setOtpLoading(false); }
  };

  const retryPayment = async (order) => {
    setRetryingOrder(order.id);
    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const existing = document.querySelector('script[data-razorpay-checkout]');
          if (existing) {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", () => reject(new Error("Unable to load payment checkout")), { once: true });
            return;
          }
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.dataset.razorpayCheckout = "true";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Unable to load payment checkout"));
          document.body.appendChild(script);
        });
      }
      if (!window.Razorpay) throw new Error("Payment checkout is unavailable");
      const response = await Axios.post(`/api/v1/payments/razorpay/${order.id}/retry`);
      const paymentOrder = response.data?.data;
      if (!paymentOrder?.keyId || !paymentOrder?.razorpayOrderId) throw new Error("Payment retry details are incomplete");
      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "PrimeCommerce",
        description: `Payment for order ${paymentOrder.orderId}`,
        order_id: paymentOrder.razorpayOrderId,
        prefill: { contact: paymentOrder.contact || "" },
        theme: { color: "#15803d" },
        handler: async (gatewayResponse) => {
          try {
            const verified = await Axios.post("/api/v1/payments/razorpay/verify", gatewayResponse);
            toast.success(verified.data?.message || "Payment response verified");
            const refreshed = await Axios.get("/api/v1/orders/mine");
            setOrders(refreshed.data?.data || []);
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment verification failed. Contact support before retrying.");
          } finally { setRetryingOrder(""); }
        },
        modal: { ondismiss: () => setRetryingOrder("") }
      });
      checkout.on("payment.failed", (event) => {
        toast.error(event.error?.description || "Payment attempt failed. You can retry while the reservation is active.");
        setRetryingOrder("");
      });
      checkout.open();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to retry payment");
      setRetryingOrder("");
    }
  };

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderId}? ${order.paymentMethod === "RAZORPAY" ? "A full refund will be requested." : "Reserved stock will be released."}`)) return;
    setCancellingOrder(order.id);
    try {
      const response = await Axios.post(`/api/v1/orders/${order.id}/cancel`);
      toast.success(response.data?.message || "Order cancelled");
      const refreshed = await Axios.get("/api/v1/orders/mine");
      setOrders(refreshed.data?.data || []);
    } catch (error) { toast.error(error.response?.data?.message || "Unable to cancel order"); }
    finally { setCancellingOrder(""); }
  };

  const openTracking = (orderId) => {
    setTrackingOrderId(current => current === orderId ? "" : orderId);
    setTracking(current => trackingOrderId === orderId ? null : current);
  };

  return (
    <section className="mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="text-2xl font-extrabold">My orders</h1>
      {location.state?.placedOrder && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><strong>Order placed successfully!</strong><br />Order ID: {location.state.placedOrder.orderId}</div>}
      {loading ? <p className="py-10 text-center text-gray-500">Loading orders…</p> : !orders.length ? (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm"><div className="text-5xl">📦</div><h2 className="mt-3 font-bold">No orders yet</h2><p className="mt-1 text-sm text-gray-500">Your placed orders will appear here.</p><Link to="/" className="mt-5 inline-flex rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">Start shopping</Link></div>
      ) : (
        <div className="mt-5 space-y-4">{orders.map(order => (
          <article key={order.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
              <div><p className="text-xs text-gray-500">Order ID</p><p className="font-bold">{order.orderId}</p><p className="mt-1 text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p></div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-800">{String(order.deliveryStatus || "processing").replaceAll("_", " ")}</span>
            </div>
            {order.paymentStatus === "paid_review_required" ? <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">Payment received — order confirmation required</p><p className="mt-1">Your Razorpay payment was captured after the stock reservation expired. This order is not confirmed for delivery. Please contact support with order ID {order.orderId}; do not make another payment for this order.</p></div> : order.deliveryStatus === "cancelled" ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">This order was cancelled.</p> : <div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between gap-2"><p className="text-sm font-bold text-slate-800">Delivery progress</p><p className="text-xs font-semibold capitalize text-green-700">{String(order.deliveryStatus || "processing").replaceAll("_", " ")}</p></div><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{deliverySteps.map((step, index) => { const currentIndex = deliverySteps.findIndex(item => item.id === (order.deliveryStatus || "processing")); const complete = currentIndex >= index; return <div key={step.id} className="min-w-0"><div className={complete ? "h-1.5 rounded-full bg-green-600" : "h-1.5 rounded-full bg-slate-200"} /><p className={complete ? "mt-2 text-[10px] leading-4 font-bold text-green-800 sm:text-xs" : "mt-2 text-[10px] leading-4 text-slate-400 sm:text-xs"}>{step.label}</p></div>; })}</div></div>}
            <div className="mt-4 space-y-2">{order.items.map((item,index) => <div key={String(item.productId) + index} className="flex justify-between gap-3 text-sm"><span className="text-gray-600">{item.name} × {item.quantity}</span><strong>₹{Number(item.lineTotal || 0).toFixed(2)}</strong></div>)}</div>
            <div className="mt-4 flex flex-wrap justify-between gap-3 border-t pt-3 text-sm"><span className="text-gray-500">{order.paymentMethod === "RAZORPAY" ? "Razorpay" : "Cash on Delivery"} · Payment {order.paymentStatus}{order.refundStatus && order.refundStatus !== "not_required" ? ` · Refund ${order.refundStatus}` : ""}</span><strong>Total ₹{Number(order.total || 0).toFixed(2)}</strong></div>
            <p className="mt-2 text-xs text-gray-500">Deliver to: {order.address?.address_line}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
            {order.paymentMethod === "RAZORPAY" && ["pending", "authorized"].includes(order.paymentStatus) && order.deliveryStatus === "processing" && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs text-amber-900">Your online payment is not confirmed yet. You can retry using the existing payment reservation while it remains active.</p><button disabled={retryingOrder === order.id} onClick={() => retryPayment(order)} className="mt-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{retryingOrder === order.id ? "Opening secure checkout…" : "Retry payment"}</button></div>}
            {order.deliveryStatus === "processing" && <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-gray-500">{order.paymentMethod === "RAZORPAY" && !["paid", "completed"].includes(order.paymentStatus) ? "Online payment is pending; cancellation becomes available after payment is confirmed." : "Cancellation is available before picker assignment."}</span>{(order.paymentMethod !== "RAZORPAY" || ["paid", "completed"].includes(order.paymentStatus)) && <button disabled={cancellingOrder === order.id} onClick={() => cancelOrder(order)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">{cancellingOrder === order.id ? "Cancelling…" : "Cancel order"}</button>}</div>}
            {order.refundStatus && order.refundStatus !== "not_required" && <p className="mt-2 text-xs font-medium text-indigo-700">Refund status: {order.refundStatus}{order.refundAmount ? ` · ₹${Number(order.refundAmount).toFixed(2)}` : ""}</p>}
            {activeTrackingStatuses.includes(order.deliveryStatus) && <div className="mt-4"><button onClick={() => openTracking(order.id)} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">{trackingOrderId === order.id ? "Hide live tracking" : "Track delivery"}</button>
              {trackingOrderId === order.id && <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold capitalize text-green-900">{String(tracking?.deliveryStatus || order.deliveryStatus).replaceAll("_", " ")}</p><span className="text-xs text-green-800">{trackingLoading ? "Refreshing…" : "Refreshes every 10 seconds"}</span></div>
                {tracking?.rider && <p className="mt-2 text-sm text-green-900">Rider: {tracking.rider.name || "Assigned rider"} {tracking.rider.mobile ? `· ${tracking.rider.mobile}` : ""}</p>}
                {(tracking?.deliveryStatus || order.deliveryStatus) === "out_for_delivery" && <div className="mt-4 rounded-xl border border-green-200 bg-white p-3">
                  <p className="text-sm font-bold text-slate-900">Delivery verification OTP</p>
                  <p className="mt-1 text-xs text-slate-600">Generate a one-time code and share it with your rider only when your order arrives. It expires in 30 minutes. Generating another code invalidates the previous one.</p>
                  {deliveryOtp?.orderId === order.id ? <div className="mt-2 flex items-center justify-between gap-3"><strong className="text-2xl tracking-[.3em] text-green-800">{deliveryOtp.otp}</strong><span className="text-xs text-slate-500">Expires {new Date(deliveryOtp.expiresAt).toLocaleTimeString()}</span></div> : <button disabled={otpLoading} onClick={() => generateDeliveryOtp(order.id)} className="mt-3 rounded-lg bg-green-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{otpLoading ? "Generating…" : "Generate / regenerate OTP"}</button>}
                </div>}
                {Number.isFinite(tracking?.location?.lat) && Number.isFinite(tracking?.location?.lng) ? <div className="mt-3"><p className="text-xs text-green-800">Last GPS update: {tracking.location.updatedAt ? new Date(tracking.location.updatedAt).toLocaleString() : "Just now"}</p><a className="mt-2 inline-flex rounded-lg bg-white px-3 py-2 text-sm font-bold text-green-800 underline" href={`https://www.openstreetmap.org/?mlat=${tracking.location.lat}&mlon=${tracking.location.lng}#map=16/${tracking.location.lat}/${tracking.location.lng}`} target="_blank" rel="noreferrer">View rider location on map</a></div> : <p className="mt-2 text-sm text-green-800">Rider GPS location is not available yet. It appears after the rider starts sharing location.</p>}
              </div>}
            </div>}
          </article>
        ))}</div>
      )}
    </section>
  );
}
