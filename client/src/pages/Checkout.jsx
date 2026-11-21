import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";
import loadRazorpayCheckout from "../utils/loadRazorpayCheckout";

const emptyAddress = { address_line: "", city: "", state: "", pincode: "", country: "India", mobile: "" };

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const load = async () => {
    try {
      const [cartResponse, addressResponse] = await Promise.all([Axios.get("/api/v1/cart"), Axios.get("/api/v1/addresses")]);
      const nextCart = cartResponse.data?.data || { items: [], subtotal: 0, itemCount: 0 };
      const nextAddresses = addressResponse.data?.data || [];
      setCart(nextCart);
      setAddresses(nextAddresses);
      setSelected((current) => current || nextAddresses[0]?._id || "");
    } catch (error) { toast.error(error.response?.data?.message || "Please login to checkout"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const saveAddress = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await Axios.post("/api/v1/addresses", { ...form, mobile: String(form.mobile) });
      const address = response.data.data;
      setAddresses((current) => [address, ...current]);
      setSelected(address._id);
      setShowForm(false);
      setForm(emptyAddress);
      toast.success("Delivery address saved");
    } catch (error) { toast.error(error.response?.data?.message || "Unable to save address"); }
    finally { setSaving(false); }
  };

  const placeOrder = async () => {
    if (!selected) { toast.error("Please select a delivery address"); return; }
    setSaving(true);
    try {
      const response = await Axios.post("/api/v1/checkout/cod", { addressId: selected });
      toast.success("Order placed successfully");
      navigate("/dashboard/myorders", { state: { placedOrder: response.data?.data } });
    } catch (error) { toast.error(error.response?.data?.message || "Unable to place order"); }
    finally { setSaving(false); }
  };

  const payOnline = async () => {
    if (!selected) { toast.error("Please select a delivery address"); return; }
    setSaving(true);
    try {
      const Razorpay = await loadRazorpayCheckout();
      const response = await Axios.post("/api/v1/payments/razorpay/order", { addressId: selected });
      const paymentOrder = response.data?.data;
      if (!paymentOrder?.keyId || !paymentOrder?.razorpayOrderId) throw new Error("Payment gateway configuration is incomplete");
      const checkout = new Razorpay({
        key: paymentOrder.keyId, amount: paymentOrder.amount, currency: paymentOrder.currency, name: "PrimeCommerce",
        description: `Order ${paymentOrder.orderId}`, order_id: paymentOrder.razorpayOrderId,
        prefill: { contact: form.mobile || addresses.find(item => item._id === selected)?.mobile || "" },
        theme: { color: "#15803d" },
        handler: async (gatewayResponse) => {
          try {
            const verified = await Axios.post("/api/v1/payments/razorpay/verify", gatewayResponse);
            toast.success(verified.data?.message || "Payment response verified");
            navigate("/dashboard/myorders", { state: { placedOrder: { orderId: paymentOrder.orderId, paymentMethod: "RAZORPAY", paymentStatus: verified.data?.paymentStatus || "pending" } } });
          } catch (error) { toast.error(error.response?.data?.message || "Payment verification failed. Contact support before retrying."); }
          finally { setSaving(false); }
        },
        modal: { ondismiss: () => setSaving(false) }
      });
      checkout.on("payment.failed", (event) => { toast.error(event.error?.description || "Payment failed"); setSaving(false); });
      checkout.open();
    } catch (error) { toast.error(error.response?.data?.message || error.message || "Unable to start online payment"); setSaving(false); }
  };

  if (loading) return <div className="min-h-[60vh] bg-[#f7f8f3] px-4 py-16"><div className="mx-auto max-w-5xl animate-pulse rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">Preparing your checkout…</div></div>;

  return (
    <main className="min-h-[70vh] bg-[#f7f8f3] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-green-700">← Back to basket</Link>
        <div className="mt-5 overflow-hidden rounded-3xl bg-[#123d2a] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-lime-300">Almost there</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Checkout</h1><p className="mt-2 max-w-lg text-sm text-green-100">Confirm where you want your order delivered and choose how you’d like to pay.</p></div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3"><span className="text-2xl">🛍️</span><div><p className="text-xs text-green-100">In your basket</p><p className="font-extrabold">{cart.itemCount || cart.items.length} items</p></div></div>
          </div>
          <div className="mt-7 grid max-w-xl grid-cols-2 gap-3 text-xs font-bold sm:text-sm">
            <div className="flex items-center gap-2 rounded-xl bg-lime-300 px-3 py-3 text-green-950"><span className="grid h-6 w-6 place-items-center rounded-full bg-green-950 text-lime-200">1</span> Delivery details</div>
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-white"><span className="grid h-6 w-6 place-items-center rounded-full bg-white/15">2</span> Payment</div>
          </div>
        </div>
        {!cart.items.length ? <div className="mt-6 rounded-2xl bg-white p-8 text-center">Your basket is empty. <Link className="font-bold text-green-700" to="/">Shop now</Link></div> : (
          <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-green-700">Step 1</p><h2 className="mt-1 text-xl font-black text-slate-900">Where should we deliver?</h2><p className="mt-1 text-sm text-slate-500">Choose a saved address or add a new one.</p></div><button type="button" onClick={() => setShowForm(!showForm)} className="rounded-xl border border-green-700 px-4 py-2.5 text-sm font-extrabold text-green-800 transition hover:bg-green-50">{showForm ? "Cancel" : "+ Add address"}</button></div>
              {showForm && <form onSubmit={saveAddress} className="mt-5 grid gap-3 rounded-2xl border border-green-100 bg-green-50/60 p-4 sm:grid-cols-2">
                <p className="text-sm font-extrabold text-slate-800 sm:col-span-2">New delivery address</p>
                <input required placeholder="House / street / area" value={form.address_line} onChange={e => setForm({...form,address_line:e.target.value})} className="rounded-lg border p-3 text-sm sm:col-span-2" />
                <input required placeholder="City" value={form.city} onChange={e => setForm({...form,city:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <input required placeholder="State" value={form.state} onChange={e => setForm({...form,state:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <input required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength="6" placeholder="6-digit pincode" value={form.pincode} onChange={e => setForm({...form,pincode:e.target.value.replace(/\D/g, "").slice(0, 6)})} className="rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
                <input required inputMode="numeric" pattern="[6-9][0-9]{9}" placeholder="10-digit mobile number" maxLength="10" value={form.mobile} onChange={e => setForm({...form,mobile:e.target.value.replace(/\D/g, "").slice(0, 10)})} className="rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
                <button disabled={saving} className="rounded-xl bg-green-800 p-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-green-900 disabled:opacity-60 sm:col-span-2">{saving ? "Saving…" : "Save address"}</button>
              </form>}
              <div className="mt-5 space-y-3">
                {addresses.map(address => <label key={address._id} className={"group flex cursor-pointer gap-3 rounded-2xl border p-4 transition " + (selected === address._id ? "border-green-700 bg-green-50 shadow-sm ring-1 ring-green-700/10" : "border-slate-200 hover:border-green-300 hover:bg-slate-50")}>
                  <input type="radio" name="address" checked={selected === address._id} onChange={() => setSelected(address._id)} className="mt-1 h-4 w-4 accent-green-700" />
                  <span className="min-w-0 flex-1 text-sm leading-6 text-slate-600"><span className="mb-1 flex flex-wrap items-center gap-2"><strong className="text-base text-slate-900">{address.address_line}</strong>{selected === address._id && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-green-800">Selected</span>}</span>{address.city}, {address.state} - {address.pincode}<br />{address.country} · {address.mobile}</span>
                </label>)}
                {!addresses.length && !showForm && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center"><span className="text-3xl">📍</span><p className="mt-2 font-bold text-slate-800">No saved addresses yet</p><p className="mt-1 text-sm text-slate-500">Add your delivery address to continue.</p><button type="button" onClick={() => setShowForm(true)} className="mt-4 rounded-xl bg-green-800 px-4 py-2.5 text-sm font-bold text-white">Add delivery address</button></div>}
              </div>
            </section>
            <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-green-700">Step 2</p><h2 className="mt-1 text-xl font-black text-slate-900">Order summary</h2>
              <p className="mt-1 text-sm text-slate-500">Review your items before placing the order.</p>
              <div className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">{cart.items.map(item => <div key={item.cartItemId} className="flex justify-between gap-3 text-sm"><span className="min-w-0 text-slate-600"><span className="block truncate font-semibold text-slate-800">{item.product.name}</span><span className="text-xs text-slate-400">Qty: {item.quantity}</span></span><strong className="shrink-0 text-slate-900">₹{item.lineTotal.toFixed(2)}</strong></div>)}</div>
              <div className="my-5 border-t border-dashed border-slate-200" />
              <div className="flex items-center justify-between text-sm text-slate-500"><span>Items ({cart.itemCount || cart.items.length})</span><span>₹{cart.subtotal.toFixed(2)}</span></div>
              <div className="mt-2 flex justify-between text-lg font-black text-slate-950"><span>Order total</span><span>₹{cart.subtotal.toFixed(2)}</span></div>
              <div className="mt-5"><p className="mb-2 text-sm font-extrabold text-slate-900">Choose payment method</p><div className="space-y-2">
                <label className={"flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition " + (paymentMethod === "COD" ? "border-green-700 bg-green-50" : "border-slate-200 hover:bg-slate-50")}><input type="radio" name="paymentMethod" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} className="h-4 w-4 accent-green-700" /><span className="flex-1"><strong className="block text-slate-900">Cash on Delivery</strong><span className="text-xs text-slate-500">Pay when your order arrives</span></span><span>💵</span></label>
                <label className={"flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition " + (paymentMethod === "RAZORPAY" ? "border-green-700 bg-green-50" : "border-slate-200 hover:bg-slate-50")}><input type="radio" name="paymentMethod" checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} className="h-4 w-4 accent-green-700" /><span className="flex-1"><strong className="block text-slate-900">Pay online</strong><span className="text-xs text-slate-500">Secure checkout with Razorpay</span></span><span>🔒</span></label>
              </div></div>
              <button disabled={saving || !selected} onClick={paymentMethod === "COD" ? placeOrder : payOnline} className="mt-5 w-full rounded-xl bg-[#123d2a] px-4 py-3.5 font-extrabold text-white shadow-sm transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Processing…" : paymentMethod === "COD" ? "Place COD order →" : "Continue to secure payment →"}</button>
              {!selected && <p className="mt-2 text-center text-xs font-medium text-amber-700">Select or add a delivery address to continue.</p>}
              <p className="mt-4 text-center text-xs text-slate-400">🔒 Your payment details are handled securely.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
