import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

export default function Myorders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios.get("/api/v1/orders/mine")
      .then(response => setOrders(response.data?.data || []))
      .catch(error => toast.error(error.response?.data?.message || "Unable to load orders"))
      .finally(() => setLoading(false));
  }, []);

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
          </article>
        ))}</div>
      )}
    </section>
  );
}
