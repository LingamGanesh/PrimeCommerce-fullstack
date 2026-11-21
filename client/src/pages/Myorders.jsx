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
    <section className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">Your purchases</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">My orders</h1><p className="mt-1 text-sm text-slate-500">Follow your orders from confirmation to doorstep delivery.</p></div><span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">{orders.length} total orders</span></div>
      {location.state?.placedOrder && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 shadow-sm"><strong>Order placed successfully!</strong><br />Order ID: {location.state.placedOrder.orderId}{location.state.confirmationMessage && <p className="mt-2">{location.state.confirmationMessage}</p>}</div>}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-sm font-medium text-slate-500">Loading your orders…</div> : !orders.length ? (
        <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><div className="text-5xl">📦</div><h2 className="mt-3 font-bold">No orders yet</h2><p className="mt-1 text-sm text-gray-500">Your placed orders will appear here.</p><Link to="/" className="mt-5 inline-flex rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">Start shopping</Link></div>
      ) : (
        <div className="space-y-4">{orders.map(order => (
          <article key={order.id} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.045)] transition hover:border-slate-300 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
              <div><p className="text-xs text-gray-500">Order ID</p><p className="font-bold">{order.orderId}</p><p className="mt-1 text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p></div>
              <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-extrabold capitalize text-amber-800">{String(order.deliveryStatus || "processing").replaceAll("_", " ")}</span>
            </div>
            {order.deliveryStatus === "cancelled" ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">This order was cancelled.</p> : <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/90 p-4"><div className="mb-3 flex items-center justify-between gap-2"><p className="text-sm font-bold text-slate-800">Delivery progress</p><p className="text-xs font-semibold capitalize text-green-700">{String(order.deliveryStatus || "processing").replaceAll("_", " ")}</p></div><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{deliverySteps.map((step, index) => { const currentIndex = deliverySteps.findIndex(item => item.id === (order.deliveryStatus || "processing")); const complete = currentIndex >= index; return <div key={step.id} className="min-w-0"><div className={complete ? "h-1.5 rounded-full bg-green-600" : "h-1.5 rounded-full bg-slate-200"} /><p className={complete ? "mt-2 text-[10px] leading-4 font-bold text-green-800 sm:text-xs" : "mt-2 text-[10px] leading-4 text-slate-400 sm:text-xs"}>{step.label}</p></div>; })}</div></div>}
            <div className="mt-4 space-y-2">{order.items.map((item,index) => <div key={String(item.productId) + index} className="flex justify-between gap-3 text-sm"><span className="text-gray-600">{item.name} × {item.quantity}</span><strong>₹{Number(item.lineTotal || 0).toFixed(2)}</strong></div>)}</div>
            <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4 text-sm"><span className="text-gray-500">{order.paymentMethod === "RAZORPAY" ? "Razorpay" : order.paymentMethod === "UPI" ? "UPI" : "Cash on Delivery"} · Payment {order.paymentStatus}{order.refundStatus && order.refundStatus !== "not_required" ? ` · Refund ${order.refundStatus}` : ""}</span><strong>Total ₹{Number(order.total || 0).toFixed(2)}</strong></div>
            <p className="mt-2 text-xs text-gray-500">Deliver to: {order.address?.address_line}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
            {order.deliveryStatus === "processing" && <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-gray-500">Cancellation is available before picker assignment.</span><button disabled={cancellingOrder === order.id} onClick={() => cancelOrder(order)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">{cancellingOrder === order.id ? "Cancelling…" : "Cancel order"}</button></div>}
            {order.refundStatus && order.refundStatus !== "not_required" && <p className="mt-2 text-xs font-medium text-indigo-700">Refund status: {order.refundStatus}{order.refundAmount ? ` · ₹${Number(order.refundAmount).toFixed(2)}` : ""}</p>}
            {activeTrackingStatuses.includes(order.deliveryStatus) && <div className="mt-4"><button onClick={() => openTracking(order.id)} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-900">{trackingOrderId === order.id ? "Hide live tracking" : "Track delivery"}</button>
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
