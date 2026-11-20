import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

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
      const scriptLoaded = await new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(true);
        const existing = document.querySelector('script[data-razorpay-checkout]');
        if (existing) { existing.addEventListener("load", () => resolve(true), { once: true }); existing.addEventListener("error", () => reject(new Error("Unable to load payment checkout")), { once: true }); return; }
        const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true; script.dataset.razorpayCheckout = "true";
        script.onload = () => resolve(true); script.onerror = () => reject(new Error("Unable to load payment checkout")); document.body.appendChild(script);
      });
      if (!scriptLoaded || !window.Razorpay) throw new Error("Payment checkout is unavailable");
      const response = await Axios.post("/api/v1/payments/razorpay/order", { addressId: selected });
      const paymentOrder = response.data?.data;
      if (!paymentOrder?.keyId || !paymentOrder?.razorpayOrderId) throw new Error("Payment gateway configuration is incomplete");
      const checkout = new window.Razorpay({
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

  if (loading) return <div className="p-10 text-center text-gray-500">Preparing checkout…</div>;

  return (
    <main className="min-h-[65vh] bg-[#fafaf7] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/cart" className="text-sm font-semibold text-green-700">← Back to basket</Link>
        <h1 className="mt-3 text-2xl font-extrabold">Checkout</h1>
        {!cart.items.length ? <div className="mt-6 rounded-2xl bg-white p-8 text-center">Your basket is empty. <Link className="font-bold text-green-700" to="/">Shop now</Link></div> : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Delivery address</h2><button onClick={() => setShowForm(!showForm)} className="text-sm font-bold text-green-700">{showForm ? "Cancel" : "+ Add new"}</button></div>
              {showForm && <form onSubmit={saveAddress} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input required placeholder="House / street / area" value={form.address_line} onChange={e => setForm({...form,address_line:e.target.value})} className="rounded-lg border p-3 text-sm sm:col-span-2" />
                <input required placeholder="City" value={form.city} onChange={e => setForm({...form,city:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <input required placeholder="State" value={form.state} onChange={e => setForm({...form,state:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <input required maxLength="6" placeholder="6-digit pincode" value={form.pincode} onChange={e => setForm({...form,pincode:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <input required placeholder="Mobile number" maxLength="10" value={form.mobile} onChange={e => setForm({...form,mobile:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <button disabled={saving} className="rounded-lg bg-green-700 p-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">{saving ? "Saving…" : "Save address"}</button>
              </form>}
              <div className="mt-4 space-y-3">
                {addresses.map(address => <label key={address._id} className={"flex cursor-pointer gap-3 rounded-xl border p-4 " + (selected === address._id ? "border-green-700 bg-green-50" : "border-gray-200")}>
                  <input type="radio" name="address" checked={selected === address._id} onChange={() => setSelected(address._id)} className="mt-1 accent-green-700" />
                  <span className="text-sm"><strong>{address.address_line}</strong><br />{address.city}, {address.state} - {address.pincode}<br />{address.country} · {address.mobile}</span>
                </label>)}
                {!addresses.length && !showForm && <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">Add a delivery address to continue.</p>}
              </div>
            </section>
            <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold">Order summary</h2>
              <div className="mt-4 space-y-3">{cart.items.map(item => <div key={item.cartItemId} className="flex justify-between gap-3 text-sm"><span className="text-gray-600">{item.product.name} × {item.quantity}</span><strong>₹{item.lineTotal.toFixed(2)}</strong></div>)}</div>
              <div className="my-4 border-t border-dashed" />
              <div className="flex justify-between font-extrabold"><span>Total</span><span>₹{cart.subtotal.toFixed(2)}</span></div>
              <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-3 text-sm"><label className="flex cursor-pointer items-center gap-2"><input type="radio" name="paymentMethod" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} /> Cash on Delivery</label><label className="flex cursor-pointer items-center gap-2"><input type="radio" name="paymentMethod" checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} /> Pay online with Razorpay</label></div>
              <button disabled={saving || !selected} onClick={paymentMethod === "COD" ? placeOrder : payOnline} className="mt-5 w-full rounded-xl bg-green-700 px-4 py-3 font-bold text-white disabled:opacity-50">{saving ? "Processing…" : paymentMethod === "COD" ? "Place COD order" : "Pay securely"}</button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
