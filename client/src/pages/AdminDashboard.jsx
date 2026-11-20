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
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPagination, setCustomerPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [reportPeriod, setReportPeriod] = useState("7d");
  const [report, setReport] = useState(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [fulfilmentStaff, setFulfilmentStaff] = useState([]);
  const [eligibleCustomers, setEligibleCustomers] = useState([]);
  const [staffCandidate, setStaffCandidate] = useState("");
  const [staffRole, setStaffRole] = useState("picker");
  const [orderAssignees, setOrderAssignees] = useState({});

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

  const loadCustomers = useCallback(async () => {
    setSectionLoading(true);
    try {
      const response = await Axios.get("/api/v1/admin/customers", { params: { search: customerSearch, page: customerPage, limit: 20 } });
      setCustomers(response.data?.data || []);
      setCustomerPagination(response.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) { toast.error(error.response?.data?.message || "Could not load customers"); }
    finally { setSectionLoading(false); }
  }, [customerSearch, customerPage]);

  const loadFulfilment = useCallback(async () => {
    setSectionLoading(true);
    try {
      const [staffResponse, customerResponse] = await Promise.all([
        Axios.get("/api/v1/admin/staff"),
        Axios.get("/api/v1/admin/customers", { params: { limit: 50, page: 1 } })
      ]);
      setFulfilmentStaff(staffResponse.data?.data || []);
      setEligibleCustomers(customerResponse.data?.data || []);
    } catch (error) { toast.error(error.response?.data?.message || "Could not load fulfilment team"); }
    finally { setSectionLoading(false); }
  }, []);

  const assignRole = async () => {
    if (!staffCandidate) return toast.error("Select an account first");
    setBusy(staffCandidate);
    try {
      await Axios.post("/api/v1/admin/staff/role", { userId: staffCandidate, role: staffRole });
      toast.success(`Account promoted to ${staffRole}`);
      setStaffCandidate("");
      await loadFulfilment();
    } catch (error) { toast.error(error.response?.data?.message || "Could not update staff role"); }
    finally { setBusy(""); }
  };

  const assignOrder = async (order, role) => {
    const staffId = orderAssignees[order._id];
    if (!staffId) return toast.error(`Select a ${role} first`);
    setBusy(order._id);
    try {
      await Axios.patch(`/api/v1/admin/orders/${order._id}/assign-${role}`, { [role === "picker" ? "pickerId" : "riderId"]: staffId });
      toast.success(`${role === "picker" ? "Picker" : "Rider"} assigned`);
      await loadData();
      await loadFulfilment();
    } catch (error) { toast.error(error.response?.data?.message || `Could not assign ${role}`); }
    finally { setBusy(""); }
  };

  const loadReport = useCallback(async () => {
    setSectionLoading(true);
    try {
      const response = await Axios.get("/api/v1/admin/reports/sales", { params: { period: reportPeriod } });
      setReport(response.data?.data || null);
    } catch (error) { toast.error(error.response?.data?.message || "Could not load sales report"); }
    finally { setSectionLoading(false); }
  }, [reportPeriod]);

  useEffect(() => {
    if (section === "customers") loadCustomers();
    if (section === "reports") loadReport();
    if (section === "fulfilment") loadFulfilment();
  }, [section, loadCustomers, loadReport, loadFulfilment]);

  const updateStock = async (product) => {
    const value = Number(stockDraft[product._id] ?? product.stock);
    if (!Number.isInteger(value) || value < 0) return toast.error("Stock must be a whole number, 0 or higher");
    setBusy(product._id);
    try {
      await Axios.patch(`/api/v1/admin/products/${product._id}`, { stock: value });
      toast.success("Inventory updated");
      setStockDraft((current) => ({ ...current, [product._id]: String(value) }));
      await loadData();
    } catch (error) { toast.error(error.response?.data?.message || "Stock update failed"); }
    finally { setBusy(""); }
  };

  const signOut = () => { dispatch(logout()); localStorage.clear(); navigate("/login"); };
  const navItems = [{ id: "overview", label: "Overview", icon: "▦" }, { id: "products", label: "Products & stock", icon: "▤" }, { id: "catalog", label: "Catalogue setup", icon: "＋" }, { id: "orders", label: "Orders", icon: "▣" }, { id: "customers", label: "Customers", icon: "♙" }, { id: "reports", label: "Sales reports", icon: "↗" }, { id: "fulfilment", label: "Picker & rider", icon: "⇢" }];
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
            {section === "orders" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-5"><h2 className="text-lg font-extrabold text-slate-900">Order management</h2><p className="text-sm text-slate-500">Review orders and update the current fulfilment status.</p></div><div className="space-y-3">{orders.map((order) => <div key={order._id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 p-4 lg:flex-row lg:items-center"><div className="min-w-0"><p className="font-bold text-slate-900">Order #{order.orderId || String(order._id).slice(-7)}</p><p className="mt-1 text-xs text-slate-500">{order.userId?.name || "Customer"} · {order.userId?.email || "—"}</p><p className="mt-1 text-xs text-slate-400">{dateLabel(order.createdAt)} · {order.payment_status || "pending"} payment</p></div><div className="flex flex-wrap items-center gap-3"><span className="font-extrabold text-slate-900">{money(order.totalAmt)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusTone(order.delivery_status)}`}>{order.delivery_status || "processing"}</span><span className="text-xs font-semibold text-slate-500">Manage dispatch in Picker & rider</span></div></div>)}{!orders.length && <p className="py-10 text-center text-sm text-slate-400">No orders found.</p>}</div></section>}


            {section === "fulfilment" && <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-extrabold text-slate-900">Fulfilment team</h2><p className="mb-4 text-sm text-slate-500">Promote an existing active customer account to picker or rider. They will sign in with their existing credentials.</p><div className="flex flex-wrap gap-3"><select value={staffCandidate} onChange={(event) => setStaffCandidate(event.target.value)} className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="">Choose existing customer</option>{eligibleCustomers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name} · {customer.email}</option>}</select><select value={staffRole} onChange={(event) => setStaffRole(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="picker">Picker</option><option value="rider">Rider</option></select><button disabled={!staffCandidate || busy === staffCandidate} onClick={assignRole} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{busy === staffCandidate ? "Saving…" : "Save role"}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{fulfilmentStaff.map((member) => <div key={member._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="font-bold text-slate-800">{member.name}</p><p className="text-xs text-slate-500">{member.email}</p></div><span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-bold capitalize text-lime-800">{member.role}</span></div>)}{!fulfilmentStaff.length && <p className="text-sm text-slate-400">No active pickers or riders assigned yet.</p>}</div></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-extrabold text-slate-900">Order dispatch</h2><p className="mb-4 text-sm text-slate-500">Assign a picker to a processing order. Once packed, assign a rider for delivery.</p><div className="space-y-3">{orders.filter((order) => !["delivered", "cancelled"].includes(order.delivery_status)).map((order) => { const status = order.delivery_status || "processing"; const pickerOptions = fulfilmentStaff.filter((member) => member.role === "picker"); const riderOptions = fulfilmentStaff.filter((member) => member.role === "rider"); return <div key={order._id} className="rounded-xl border border-slate-100 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold text-slate-900">#{order.orderId || String(order._id).slice(-7)}</p><p className="text-xs text-slate-500">{order.userId?.name || "Customer"} · {money(order.totalAmt)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusTone(status)}`}>{String(status).replaceAll("_", " ")}</span></div>{status === "processing" && <div className="flex flex-wrap gap-2"><select value={orderAssignees[order._id] || ""} onChange={(event) => setOrderAssignees((current) => ({ ...current, [order._id]: event.target.value }))} className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Choose picker</option>{pickerOptions.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select><button disabled={busy === order._id || !pickerOptions.length} onClick={() => assignOrder(order, "picker")} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Assign picker</button></div>}{status === "packed" && <div className="flex flex-wrap gap-2"><select value={orderAssignees[order._id] || ""} onChange={(event) => setOrderAssignees((current) => ({ ...current, [order._id]: event.target.value }))} className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Choose rider</option>{riderOptions.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select><button disabled={busy === order._id || !riderOptions.length} onClick={() => assignOrder(order, "rider")} className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-extrabold text-slate-950 disabled:opacity-40">Assign rider</button></div>}{["picking", "rider_assigned", "picked_up", "out_for_delivery"].includes(status) && <p className="text-xs text-slate-500">Assigned staff: {order.pickerId?.name || (order.pickerId ? "Picker assigned" : "—")} {order.riderId?.name || (order.riderId ? "· Rider assigned" : "")}</p>}</div>; })}{!orders.some((order) => !["delivered", "cancelled"].includes(order.delivery_status)) && <p className="py-8 text-center text-sm text-slate-400">No orders waiting for dispatch.</p>}</div></div>
            </section>}
            {section === "customers" && <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900">Customer management</h2><p className="text-sm text-slate-500">Search customers and review account and paid-order activity. Sensitive authentication fields are never returned.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{customerPagination.total || 0} customers</span></div>
              <div className="mb-4 flex flex-wrap gap-3"><input value={customerSearch} onChange={(event) => { setCustomerSearch(event.target.value); setCustomerPage(1); }} placeholder="Search name, email or mobile…" className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><button onClick={loadCustomers} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Search</button></div>
              {sectionLoading ? <p className="py-10 text-center text-sm text-slate-400">Loading customers…</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><th className="pb-3">Customer</th><th className="pb-3">Mobile</th><th className="pb-3">Account</th><th className="pb-3">Orders</th><th className="pb-3">Paid spend</th><th className="pb-3">Joined</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer._id} className="border-b border-slate-50"><td className="py-4"><p className="font-bold text-slate-800">{customer.name}</p><p className="text-xs text-slate-400">{customer.email}</p></td><td className="py-4">{customer.mobile || "—"}</td><td className="py-4"><span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${customer.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{customer.status || "unknown"}</span></td><td className="py-4 font-semibold">{customer.orderCount}</td><td className="py-4 font-semibold">{money(customer.paidSpend)}</td><td className="py-4 text-slate-500">{dateLabel(customer.createdAt)}</td></tr>)}</tbody></table>{!customers.length && <p className="py-10 text-center text-sm text-slate-400">No customers match this search.</p>}</div>}
              <div className="mt-5 flex items-center justify-between"><p className="text-xs text-slate-400">Page {customerPagination.page || 1} of {Math.max(1, customerPagination.pages || 1)}</p><div className="flex gap-2"><button disabled={customerPage <= 1 || sectionLoading} onClick={() => setCustomerPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><button disabled={customerPage >= (customerPagination.pages || 1) || sectionLoading} onClick={() => setCustomerPage((page) => page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div></div>
            </section>}
            {section === "reports" && <section className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900">Sales analytics</h2><p className="text-sm text-slate-500">Revenue includes orders with paid or completed payment status only.</p></div><select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option></select></div>
              {sectionLoading || !report ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">Loading sales report…</div> : <>
                <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Paid revenue</p><p className="mt-2 text-2xl font-black text-slate-900">{money(report.totals?.paidRevenue)}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">All orders</p><p className="mt-2 text-2xl font-black text-slate-900">{report.totals?.orderCount || 0}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Paid orders</p><p className="mt-2 text-2xl font-black text-slate-900">{report.totals?.paidOrders || 0}</p></div></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold text-slate-900">Daily paid revenue</h3><p className="mb-5 text-xs text-slate-400">Each bar represents paid revenue for that day</p><div className="space-y-3">{report.daily?.map((day) => { const max = Math.max(1, ...(report.daily || []).map((item) => item.revenue || 0)); return <div key={day.date} className="grid grid-cols-[76px_1fr_92px] items-center gap-3 text-xs"><span className="text-slate-500">{new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-lime-400" style={{ width: `${Math.max(day.revenue > 0 ? 2 : 0, (day.revenue / max) * 100)}%` }} /></div><span className="text-right font-semibold text-slate-700">{money(day.revenue)}</span></div>; })}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-bold text-slate-900">Order fulfilment status</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(report.statuses || []).map((item) => <div key={item.status} className="rounded-xl bg-slate-50 p-4"><p className="text-xs capitalize text-slate-500">{String(item.status).replaceAll("_", " ")}</p><p className="mt-1 text-2xl font-black text-slate-900">{item.count}</p></div>)}{!report.statuses?.length && <p className="text-sm text-slate-400">No orders in this period.</p>}</div></div>
              </>}
            </section>}
          </>}</div>
      </main>
    </div>
  </div>;
}