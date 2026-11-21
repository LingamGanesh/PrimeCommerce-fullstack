import { useCallback, useEffect, useState } from "react";
import Axios from "../utils/Axios";
import toast from "react-hot-toast";

export default function Support() {
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { const [ticketResponse, orderResponse] = await Promise.all([Axios.get("/api/v1/support/mine"), Axios.get("/api/v1/orders/mine")]); setTickets(ticketResponse.data?.data || []); setOrders(orderResponse.data?.data || []); }
    catch (error) { toast.error(error.response?.data?.message || "Unable to load support requests"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    try { await Axios.post("/api/v1/support", { subject, message, orderId: orderId || null }); toast.success("Support request submitted"); setSubject(""); setMessage(""); setOrderId(""); await load(); }
    catch (error) { toast.error(error.response?.data?.message || "Unable to submit support request"); }
    finally { setSending(false); }
  };
  return <section className="mx-auto max-w-5xl space-y-6"><div className="rounded-[24px] bg-gradient-to-br from-[#14251c] via-[#1e3828] to-[#31532d] p-6 text-white shadow-[0_16px_36px_rgba(20,37,28,.12)] sm:p-7"><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-lime-200/80">We are here to help</p><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Customer support</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">Tell us what happened and our support team will help you resolve it. Link an order for faster assistance.</p></div>
    <form onSubmit={submit} className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.045)] sm:p-7"><label className="block text-sm font-semibold">Subject<input required minLength={4} maxLength={120} value={subject} onChange={e => setSubject(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 font-normal outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="What do you need help with?" /></label>
      <label className="block text-sm font-semibold">Related order (optional)<select value={orderId} onChange={e => setOrderId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 font-normal outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"><option value="">No specific order</option>{orders.map(order => <option key={order.id} value={order.id}>{order.orderId} · {order.deliveryStatus}</option>)}</select></label>
      <label className="block text-sm font-semibold">Message<textarea required minLength={10} maxLength={3000} rows={4} value={message} onChange={e => setMessage(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="Describe the issue (10–3000 characters)" /></label>
      <button disabled={sending} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-950 disabled:opacity-50">{sending ? "Submitting…" : "Submit support request"}</button></form>
    <div><div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">Previous conversations</p><h2 className="mt-1 text-xl font-black text-slate-950">Your support requests</h2></div>{loading ? <p className="py-8 text-center text-sm text-slate-400">Loading…</p> : <div className="space-y-3">{tickets.map(ticket => <article key={ticket._id} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold text-slate-900">{ticket.subject}</h3><p className="mt-1 text-xs text-slate-400">{ticket.orderId?.orderId ? `Order ${ticket.orderId.orderId} · ` : ""}{new Date(ticket.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-800">{ticket.status.replaceAll("_", " ")}</span></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{ticket.message}</p>{ticket.adminReply && <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase text-green-800">Support reply</p><p className="mt-1 whitespace-pre-wrap text-sm text-green-950">{ticket.adminReply}</p></div>}</article>)}{!tickets.length && <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No support requests yet.</p>}</div>}</div>
  </section>;
}