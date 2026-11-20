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
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replying, setReplying] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { const [ticketResponse, orderResponse] = await Promise.all([Axios.get("/api/v1/support/mine"), Axios.get("/api/v1/orders/mine")]); setTickets(ticketResponse.data?.data || []); setOrders(orderResponse.data?.data || []); }
    catch (error) { toast.error(error.response?.data?.message || "Unable to load support requests"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const submitReply = async (ticketId) => {
    const reply = String(replyDrafts[ticketId] || "").trim();
    if (reply.length < 2 || reply.length > 3000) return toast.error("Reply must be between 2 and 3000 characters");
    setReplying(ticketId);
    try {
      await Axios.post("/api/v1/support/" + ticketId + "/messages", { message: reply });
      setReplyDrafts(current => ({ ...current, [ticketId]: "" }));
      toast.success("Reply sent");
      await load();
    } catch (error) { toast.error(error.response?.data?.message || "Unable to send reply"); }
    finally { setReplying(""); }
  };

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
    <div><h2 className="mb-3 text-lg font-bold">Your support requests</h2>{loading ? <p className="py-8 text-center text-sm text-slate-400">Loading…</p> : <div className="space-y-3">{tickets.map(ticket => <article key={ticket._id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold text-slate-900">{ticket.subject}</h3><p className="mt-1 text-xs text-slate-400">{ticket.orderId?.orderId ? `Order ${ticket.orderId.orderId} · ` : ""}{new Date(ticket.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-800">{ticket.status.replaceAll("_", " ")}</span></div>{Array.isArray(ticket.messages) && ticket.messages.length ? <div className="mt-4 space-y-3">{ticket.messages.map((entry, index) => <div key={ticket._id + "-" + index} className={"rounded-xl p-4 " + (entry.senderRole === "admin" ? "bg-green-50" : "bg-slate-50")}><p className="text-xs font-bold uppercase text-slate-500">{entry.senderRole === "admin" ? "Support team" : "You"}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{entry.body}</p><p className="mt-2 text-[11px] text-slate-400">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}</p></div>)}</div> : <><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{ticket.message}</p>{ticket.adminReply && <div className="mt-4 rounded-xl bg-green-50 p-4"><p className="text-xs font-bold uppercase text-green-800">Support reply</p><p className="mt-1 whitespace-pre-wrap text-sm text-green-950">{ticket.adminReply}</p></div>}</>}{!["closed", "resolved"].includes(ticket.status) && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><textarea rows={2} maxLength={3000} value={replyDrafts[ticket._id] || ""} onChange={event => setReplyDrafts(current => ({ ...current, [ticket._id]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Reply to support (2–3000 characters)" /><button type="button" disabled={replying === ticket._id} onClick={() => submitReply(ticket._id)} className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{replying === ticket._id ? "Sending…" : "Send reply"}</button></div>}</article>)}{!tickets.length && <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No support requests yet.</p>}</div>}</div>
  </section>;
}