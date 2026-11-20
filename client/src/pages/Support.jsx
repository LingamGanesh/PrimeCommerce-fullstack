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
  return <section className="mx-auto max-w-4xl space-y-6"><div><h1 className="text-2xl font-extrabold text-slate-900">Customer support</h1><p className="mt-1 text-sm text-slate-500">Send us your question or issue. You can link a specific order if needed.</p></div>
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><label className="block text-sm font-semibold">Subject<input required minLength={4} maxLength={120} value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="What do you need help with?" /></label>
      <label className="block text-sm font-semibold">Related order (optional)<select value={orderId} onChange={e => setOrderId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"><option value="">No specific order</option>{orders.map(order => <option key={order.id} value={order.id}>{order.orderId} · {order.deliveryStatus}</option>)}</select></label>
      <label className="block text-sm font-semibold">Message<textarea required minLength={10} maxLength={3000} rows={4} value={message} onChange={e => setMessage(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="Describe the issue (10–3000 characters)" /></label>
      <button disabled={sending} className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{sending ? "Submitting…" : "Submit support request"}</button></form>
    <div><h2 className="mb-3 text-lg font-bold">Your support requests</h2>{loading ? <p className="py-8 text-center text-sm text-slate-400">Loading…</p> : <div className="space-y-3">{tickets.map(ticket => <article key={ticket._id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold text-slate-900">{ticket.subject}</h3><p className="mt-1 text-xs text-slate-400">{ticket.orderId?.orderId ? `Order ${ticket.orderId.orderId} · ` : ""}{new Date(ticket.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-800">{ticket.status.replaceAll("_", " ")}</span></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{ticket.message}</p>{ticket.adminReply && <div className="mt-4 rounded-xl bg-green-50 p-4"><p className="text-xs font-bold uppercase text-green-800">Support reply</p><p className="mt-1 whitespace-pre-wrap text-sm text-green-950">{ticket.adminReply}</p></div>}</article>)}{!tickets.length && <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No support requests yet.</p>}</div>}</div>
  </section>;
}