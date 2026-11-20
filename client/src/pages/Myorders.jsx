import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

const activeTrackingStatuses = ["rider_assigned", "picked_up", "out_for_delivery"];

export default function Myorders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState("");
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);

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
            <div className="mt-4 space-y-2">{order.items.map((item,index) => <div key={String(item.productId) + index} className="flex justify-between gap-3 text-sm"><span className="text-gray-600">{item.name} × {item.quantity}</span><strong>₹{Number(item.lineTotal || 0).toFixed(2)}</strong></div>)}</div>
            <div className="mt-4 flex flex-wrap justify-between gap-3 border-t pt-3 text-sm"><span className="text-gray-500">Cash on Delivery · Payment {order.paymentStatus}</span><strong>Total ₹{Number(order.total || 0).toFixed(2)}</strong></div>
            <p className="mt-2 text-xs text-gray-500">Deliver to: {order.address?.address_line}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
            {activeTrackingStatuses.includes(order.deliveryStatus) && <div className="mt-4"><button onClick={() => openTracking(order.id)} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">{trackingOrderId === order.id ? "Hide live tracking" : "Track delivery"}</button>
              {trackingOrderId === order.id && <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold capitalize text-green-900">{String(tracking?.deliveryStatus || order.deliveryStatus).replaceAll("_", " ")}</p><span className="text-xs text-green-800">{trackingLoading ? "Refreshing…" : "Refreshes every 10 seconds"}</span></div>
                {tracking?.rider && <p className="mt-2 text-sm text-green-900">Rider: {tracking.rider.name || "Assigned rider"} {tracking.rider.mobile ? `· ${tracking.rider.mobile}` : ""}</p>}
                {order.deliveryStatus === "out_for_delivery" && <div className="mt-4 rounded-xl border border-green-200 bg-white p-3">
                  <p className="text-sm font-bold text-slate-900">Delivery verification OTP</p>
                  <p className="mt-1 text-xs text-slate-600">Generate a one-time code and share it with your rider only when your order arrives. It expires in 30 minutes.</p>
                  {deliveryOtp?.orderId === order.id ? <div className="mt-2 flex items-center justify-between gap-3"><strong className="text-2xl tracking-[.3em] text-green-800">{deliveryOtp.otp}</strong><span className="text-xs text-slate-500">Expires {new Date(deliveryOtp.expiresAt).toLocaleTimeString()}</span></div> : <button disabled={otpLoading} onClick={() => generateDeliveryOtp(order.id)} className="mt-3 rounded-lg bg-green-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{otpLoading ? "Generating…" : "Generate delivery OTP"}</button>}
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
