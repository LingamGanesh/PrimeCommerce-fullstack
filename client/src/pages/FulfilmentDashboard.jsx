import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Axios from "../utils/Axios";
import toast from "react-hot-toast";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateLabel = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function FulfilmentDashboard() {
  const user = useSelector((state) => state.user);
  const role = user?.role;
  const isPicker = role === "picker";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [sharingOrderId, setSharingOrderId] = useState("");
  const [deliveryOtps, setDeliveryOtps] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const watchIdRef = useRef(null);
  const lastLocationSentAt = useRef(0);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Axios.get(isPicker ? "/api/v1/fulfilment/picker/orders" : "/api/v1/fulfilment/rider/orders");
      setOrders(response.data?.data || []);
    } catch (error) { toast.error(error.response?.data?.message || "Unable to load assigned orders"); }
    finally { setLoading(false); }
  }, [isPicker]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const stopLocationSharing = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setSharingOrderId("");
  }, []);

  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const startLocationSharing = (order) => {
    if (!navigator.geolocation) {
      toast.error("This browser does not support location sharing");
      return;
    }
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    lastLocationSentAt.current = 0;
    setSharingOrderId(order._id);
    watchIdRef.current = navigator.geolocation.watchPosition(async (position) => {
      const now = Date.now();
      if (now - lastLocationSentAt.current < 5000) return;
      lastLocationSentAt.current = now;
      try {
        await Axios.patch(`/api/v1/fulfilment/rider/orders/${order._id}/location`, {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to share location");
        stopLocationSharing();
      }
    }, (error) => {
      toast.error(error.code === 1 ? "Allow location permission to share your delivery location" : "Unable to read your current location");
      stopLocationSharing();
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  };

  const updateStatus = async (order, status) => {
    setBusy(order._id);
    try {
      await Axios.patch(`/api/v1/fulfilment/${role}/orders/${order._id}/status`, { delivery_status: status });
      if (status === "delivered" && sharingOrderId === order._id) stopLocationSharing();
      toast.success(isPicker ? "Order packed successfully" : `Delivery updated: ${status.replaceAll("_", " ")}`);
      await loadOrders();
    } catch (error) { toast.error(error.response?.data?.message || "Status update failed"); }
    finally { setBusy(""); }
  };

  const verifyOtp = async (order) => {
    const otp = String(deliveryOtps[order._id] || "").trim();
    if (!/^\d{6}$/.test(otp)) { toast.error("Enter the customer 6-digit OTP"); return; }
    setBusy(order._id);
    try {
      await Axios.post(`/api/v1/fulfilment/rider/orders/${order._id}/verify-otp`, { otp });
      if (sharingOrderId === order._id) stopLocationSharing();
      setDeliveryOtps(current => ({ ...current, [order._id]: "" }));
      toast.success("OTP verified. Order marked delivered.");
      await loadOrders();
    } catch (error) { toast.error(error.response?.data?.message || "OTP verification failed"); }
    finally { setBusy(""); }
  };

  const address = (value) => [value?.address_line, value?.city, value?.state, value?.pincode].filter(Boolean).join(", ") || value?.fullAddress || "Address not available";
  const visibleOrders = orders.filter((order) => {
    const query = search.trim().toLowerCase();
    const searchable = [order.orderId, order.userId?.name, order.userId?.mobile, address(order.delivery_address)].filter(Boolean).join(" ").toLowerCase();
    return (!query || searchable.includes(query)) && (statusFilter === "all" || order.delivery_status === statusFilter);
  });
  const statusCounts = orders.reduce((counts, order) => {
    counts[order.delivery_status] = (counts[order.delivery_status] || 0) + 1;
    return counts;
  }, {});
  const nextAction = (status) => {
    if (isPicker && status === "picking") return { label: "Mark packed", next: "packed" };
    if (!isPicker && status === "rider_assigned") return { label: "Confirm pickup", next: "picked_up" };
    if (!isPicker && status === "picked_up") return { label: "Start delivery", next: "out_for_delivery" };
    return null;
  };

  return <div className="min-h-screen bg-[#f5f7f2] p-4 sm:p-8">
    <div className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-[26px] bg-gradient-to-br from-[#14251c] via-[#1e3828] to-[#31532d] p-6 text-white shadow-[0_16px_36px_rgba(20,37,28,.14)] sm:p-7">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">{isPicker ? "Picker workspace" : "Rider workspace"}</p><h1 className="mt-2 text-2xl font-black">Hello, {user?.name || (isPicker ? "Picker" : "Rider")}</h1><p className="mt-1 text-sm text-slate-300">{isPicker ? "Pick and pack the orders assigned to you." : "Manage deliveries and share your location while on the road."}</p></div>
        <button onClick={loadOrders} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/15">↻ Refresh queue</button>
      </header>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.04)]"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Active orders</p><p className="mt-1 text-2xl font-black text-slate-900">{orders.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{isPicker ? "Awaiting packing" : "Awaiting pickup"}</p><p className="mt-1 text-2xl font-black text-slate-900">{(statusCounts[isPicker ? "picking" : "rider_assigned"] || 0)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{isPicker ? "Packed" : "Out for delivery"}</p><p className="mt-1 text-2xl font-black text-slate-900">{(statusCounts[isPicker ? "packed" : "out_for_delivery"] || 0)}</p></div>
      </div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold text-slate-900">{isPicker ? "My picking queue" : "My deliveries"}</h2><p className="text-sm text-slate-500">Only orders assigned to your staff account are shown.</p></div><span className="rounded-full bg-lime-100 px-3 py-1.5 text-sm font-bold text-lime-800">{orders.length} active</span></div>
      <div className="mb-5 grid gap-3 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_220px]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, phone or address" className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100">
          <option value="all">All active statuses</option>
          {(isPicker ? ["picking", "packed"] : ["rider_assigned", "picked_up", "out_for_delivery"]).map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
        </select>
      </div>
      {loading ? <div className="rounded-2xl bg-white p-12 text-center text-slate-500">Loading assigned work…</div> : <div className="grid gap-4 lg:grid-cols-2">
        {visibleOrders.map((order) => {
          const action = nextAction(order.delivery_status);
          return <article key={order._id} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.045)] transition hover:border-slate-300 sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-400">ORDER #{order.orderId || String(order._id).slice(-7)}</p><h3 className="mt-1 font-extrabold text-slate-900">{order.userId?.name || "Customer"}</h3><p className="text-sm text-slate-500">{order.userId?.mobile || order.delivery_address?.mobile || "No phone number"}</p></div><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold capitalize text-amber-800">{String(order.delivery_status).replaceAll("_", " ")}</span></div>
            <div className="my-4 rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Items</p>{(order.items || []).map((item, index) => <div key={item.productId || item._id || index} className="flex justify-between gap-3 py-1 text-sm"><span className="text-slate-700">{item.name || item.product_name || "Product"} × {item.quantity || 1}</span><b className="text-slate-900">{money(item.lineTotal ?? item.price * (item.quantity || 1))}</b></div>)}{!order.items?.length && <p className="text-sm text-slate-400">Order item details unavailable</p>}</div>
            <div className="space-y-1 text-sm"><p className="font-semibold text-slate-800">Delivery address</p><p className="text-slate-500">{address(order.delivery_address)}</p></div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-400">Order total · {dateLabel(order.createdAt)}</p><p className="text-lg font-black text-slate-900">{money(order.totalAmt)}</p></div><div className="flex flex-wrap gap-2">{!isPicker && ["picked_up", "out_for_delivery"].includes(order.delivery_status) && (sharingOrderId === order._id ? <button onClick={stopLocationSharing} className="rounded-xl border border-amber-300 px-3 py-3 text-sm font-bold text-amber-800">Stop location</button> : <button onClick={() => startLocationSharing(order)} className="rounded-xl border border-slate-300 px-3 py-3 text-sm font-bold text-slate-700">Share GPS</button>)}{action && <button disabled={busy === order._id} onClick={() => updateStatus(order, action.next)} className="rounded-xl bg-[#c9f24a] px-4 py-3 text-sm font-extrabold text-slate-950 shadow-sm transition hover:bg-lime-300 disabled:opacity-50">{busy === order._id ? "Updating…" : action.label}</button>}{!isPicker && order.delivery_status === "out_for_delivery" && <div className="flex items-center gap-2"><input inputMode="numeric" maxLength={6} value={deliveryOtps[order._id] || ""} onChange={event => setDeliveryOtps(current => ({ ...current, [order._id]: event.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="Customer OTP" className="w-32 rounded-xl border border-slate-300 px-3 py-3 text-sm" aria-label="Customer delivery OTP" /><button disabled={busy === order._id || (deliveryOtps[order._id] || "").length !== 6} onClick={() => verifyOtp(order)} className="rounded-xl bg-emerald-950 px-3 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-black disabled:opacity-40">{busy === order._id ? "Verifying…" : "Verify & deliver"}</button></div>}</div></div>
            {!isPicker && sharingOrderId === order._id && <p className="mt-3 text-xs font-medium text-green-700">GPS sharing is active while this dashboard remains open. Keep location permission enabled.</p>}
          </article>;
        })}
        {!visibleOrders.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center lg:col-span-2"><p className="font-bold text-slate-700">{orders.length ? "No matching orders" : `No active ${isPicker ? "picking" : "delivery"} orders`}</p><p className="mt-1 text-sm text-slate-400">{orders.length ? "Try another search or status filter." : "New orders appear here after an administrator assigns them to you."}</p></div>}
      </div>}
    </div>
  </div>;
}
