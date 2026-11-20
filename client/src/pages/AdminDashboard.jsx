import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Axios from "../utils/Axios";
import { logout } from "../store/UserSlice";
import toast from "react-hot-toast";
import AdminCatalog from "./AdminCatalog";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateLabel = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const statusTone = (status) => status === "delivered" ? "bg-emerald-50 text-emerald-700" : status === "cancelled" ? "bg-rose-50 text-rose-700" : status === "shipped" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stockDraft, setStockDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, inventory, orderList] = await Promise.all([
        Axios.get("/api/v1/admin/overview"),
        Axios.get("/api/v1/admin/products"),
        Axios.get("/api/v1/admin/orders")
      ]);
      setOverview(summary.data?.data || {});
      setProducts(inventory.data?.data || []);
      setOrders(orderList.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load admin data");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStock = async (product) => {
    const value = Number(stockDraft[product._id] ?? product.stock);
    if (!Number.isInteger(value) || value < 0) return toast.error("Stock must be a whole number, 0 or higher");
    setBusy(product._id);
    try {
      await Axios.patch(`/api/v1/catalog/admin/products/${product._id}`, { stock: value });
      toast.success("Inventory updated");
      setStockDraft((current) => ({ ...current, [product._id]: String(value) }));
      await loadData();
    } catch (error) { toast.error(error.response?.data?.message || "Stock update failed"); }
    finally { setBusy(""); }
  };

  const updateOrder = async (orderId, delivery_status) => {
    setBusy(orderId);
    try {
      await Axios.patch(`/api/v1/admin/orders/${orderId}/status`, { delivery_status });
      toast.success("Order status updated");
      await loadData();
    } catch (error) { toast.error(error.response?.data?.message || "Order update failed"); }
    finally { setBusy(""); }
  };

  const signOut = () => { dispatch(logout()); localStorage.clear(); navigate("/login"); };
  const navItems = [{ id: "overview", label: "Overview", icon: "▦" }, { id: "products", label: "Products & stock", icon: "▤" }, { id: "catalog", label: "Catalogue setup", icon: "＋" }, { id: "orders", label: "Orders", icon: "▣" }];
  const metrics = [
    { label: "Total orders", value: overview?.orders ?? "—", note: "All recorded orders", icon: "▣" },
    { label: "Gross paid revenue", value: money(overview?.revenue), note: "Paid / completed payments", icon: "₹" },
    { label: "Active products", value: overview?.products ?? "—", note: "Published catalogue items", icon: "▤" },
    { label: "Low stock alerts", value: overview?.lowStock ?? "—", note: "5 units or fewer", icon: "!" }
  ];

  return <div className="min-h-screen bg-slate-50 -m-4 sm:-m-6 lg:-m-8">
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-slate-950 text-white p-5">
        <div className="flex items-center gap-3 px-2 py-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400 text-xl font-black text-slate-950">b</div><div><p className="font-extrabold tracking-tight">blinkit</p><p className="text-xs text-slate-400">Operations console</p></div></div>
        <p className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Workspace</p>
        <nav className="mt-3 space-y-1">{navItems.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${section === item.id ? "bg-lime-400 text-slate-950" : "text-slate-300 hover:bg-white/10"}`}><span className="text-lg">{item.icon}</span>{item.label}</button>)}</nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-semibold">Admin access</p><p className="mt-1 text-xs leading-5 text-slate-400">This workspace is restricted to verified administrator accounts.</p><button onClick={signOut} className="mt-4 w-full rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10">Sign out</button></div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur sm:px-8"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin workspace</p><h1 className="text-xl font-extrabold text-slate-900"> {navItems.find((item) => item.id === section)?.label}</h1></div><div className="flex items-center gap-3"><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">● Secure session</span><button onClick={loadData} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">↻ Refresh</button><button onClick={signOut} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white md:hidden">Exit</button></div></header>
        <div className="p-5 sm:p-8">
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">{navItems.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${section === item.id ? "bg-lime-400 text-slate-950" : "bg-white text-slate-600"}`}>{item.label}</button>)}</div>
          {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading live store data…</div> : <>
            {section === "overview" && <>
              <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-500">Your store at a glance</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">Good day, Admin 👋</h2></div><p className="text-xs text-slate-400">Live data from your database</p></div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{metric.label}</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-50 text-lg font-bold text-lime-700">{metric.icon}</span></div><p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{metric.value}</p><p className="mt-1 text-xs text-slate-400">{metric.note}</p></div>)}</div>
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold text-slate-900">Recent orders</h3><p className="text-xs text-slate-400">Latest customer purchases</p></div><button onClick={() => setSection("orders")} className="text-sm font-bold text-emerald-700">View all →</button></div><div className="space-y-3">{(overview?.recentOrders || []).slice(0, 6).map((order) => <div key={order._id} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">#{order.orderId || String(order._id).slice(-7)}</p><p className="truncate text-xs text-slate-400">{order.userId?.name || "Customer"} · {dateLabel(order.createdAt)}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">{money(order.totalAmt)}</p><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold capitalize ${statusTone(order.delivery_status)}`}>{order.delivery_status || "processing"}</span></div></div>)}{!overview?.recentOrders?.length && <p className="py-8 text-center text-sm text-slate-400">No orders have been placed yet.</p>}</div></section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold text-slate-900">Store summary</h3><p className="mt-1 text-xs text-slate-400">Current catalogue and customer base</p><div className="mt-5 space-y-4"><div className="flex justify-between text-sm"><span className="text-slate-500">Customers</span><b>{overview?.customers ?? 0}</b></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (overview?.customers || 0) / Math.max(overview?.customers || 1, 100) * 100)}%` }} /></div><div className="flex justify-between text-sm"><span className="text-slate-500">Categories</span><b>{overview?.categories ?? 0}</b></div><div className="flex justify-between text-sm"><span className="text-slate-500">Published products</span><b>{overview?.products ?? 0}</b></div><div className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Low-stock alert counts products with 5 units or fewer. Review inventory before accepting more orders.</div></div></section></div>
            </>}
            {section === "products" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-5"><h2 className="text-lg font-extrabold text-slate-900">Product inventory</h2><p className="text-sm text-slate-500">Update available stock for existing catalogue products.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><th className="pb-3">Product</th><th className="pb-3">Price</th><th className="pb-3">Stock</th><th className="pb-3">Visibility</th><th className="pb-3">Action</th></tr></thead><tbody>{products.map((product) => <tr key={product._id} className="border-b border-slate-50"><td className="py-4"><p className="font-bold text-slate-800">{product.name}</p><p className="text-xs text-slate-400">{product.unit || "—"}</p></td><td className="py-4 font-semibold">{money(product.price)}</td><td className="py-4"><input type="number" min="0" step="1" value={stockDraft[product._id] ?? product.stock ?? 0} onChange={(event) => setStockDraft((current) => ({ ...current, [product._id]: event.target.value }))} className="w-24 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500" /></td><td className="py-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${product.publish ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{product.publish ? "Published" : "Hidden"}</span></td><td className="py-4"><button disabled={busy === product._id} onClick={() => updateStock(product)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy === product._id ? "Saving…" : "Save stock"}</button></td></tr>)}</tbody></table>{!products.length && <p className="py-10 text-center text-sm text-slate-400">No products found.</p>}</div></section>}
            {section === "catalog" && <AdminCatalog products={products} onRefresh={loadData} />}
            {section === "orders" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-5"><h2 className="text-lg font-extrabold text-slate-900">Order management</h2><p className="text-sm text-slate-500">Review orders and update the current fulfilment status.</p></div><div className="space-y-3">{orders.map((order) => <div key={order._id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 p-4 lg:flex-row lg:items-center"><div className="min-w-0"><p className="font-bold text-slate-900">Order #{order.orderId || String(order._id).slice(-7)}</p><p className="mt-1 text-xs text-slate-500">{order.userId?.name || "Customer"} · {order.userId?.email || "—"}</p><p className="mt-1 text-xs text-slate-400">{dateLabel(order.createdAt)} · {order.payment_status || "pending"} payment</p></div><div className="flex flex-wrap items-center gap-3"><span className="font-extrabold text-slate-900">{money(order.totalAmt)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusTone(order.delivery_status)}`}>{order.delivery_status || "processing"}</span><select aria-label="Update order status" disabled={busy === order._id || ["delivered", "cancelled"].includes(order.delivery_status)} value={order.delivery_status || "processing"} onChange={(event) => updateOrder(order._id, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></div></div>)}{!orders.length && <p className="py-10 text-center text-sm text-slate-400">No orders found.</p>}</div></section>}
          </>}</div>
      </main>
    </div>
  </div>;
}