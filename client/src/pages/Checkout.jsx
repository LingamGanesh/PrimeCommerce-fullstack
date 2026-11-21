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
  const [locating, setLocating] = useState(false);
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

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const query = new URLSearchParams({ format: "jsonv2", lat: String(coords.latitude), lon: String(coords.longitude) });
        const response = await fetch("https://nominatim.openstreetmap.org/reverse?" + query.toString());
        if (!response.ok) throw new Error("Unable to look up this location");
        const result = await response.json();
        const address = result.address || {};
        const line = [result.name, address.road, address.suburb, address.neighbourhood].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(", ");
        setForm((current) => ({
          ...current,
          address_line: line || result.display_name || current.address_line,
          city: address.city || address.town || address.village || address.county || current.city,
          state: address.state || current.state,
          pincode: address.postcode || current.pincode,
          country: address.country || current.country
        }));
        setShowForm(true);
        toast.success("Location detected. Please confirm your address and mobile number.");
      } catch (error) {
        toast.error(error.message || "Could not read this location. Enter your address manually.");
      } finally {
        setLocating(false);
      }
    }, (error) => {
      setLocating(false);
      toast.error(error.code === 1 ? "Please allow location access or enter your address manually." : "Could not detect your location. Try again or enter it manually.");
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  };

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
      const order = response.data?.data;
      const deliveryMessage = "Your COD order is confirmed! We will deliver it to your selected address. Please pay ₹" + Number(order?.total ?? cart.subtotal).toFixed(2) + " in cash when our delivery partner arrives.";
      toast.success(deliveryMessage, { duration: 7000 });
      navigate("/dashboard/myorders", { state: { placedOrder: order, confirmationMessage: deliveryMessage } });
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
        theme: { color: "#9acb28" },
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
    <main className="min-h-[65vh] bg-[#f7f9f2] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/cart" className="text-sm font-semibold text-[#5d8414]">← Back to basket</Link>
        <h1 className="mt-3 text-2xl font-extrabold">Checkout</h1>
        {!cart.items.length ? <div className="mt-6 rounded-2xl bg-white p-8 text-center">Your basket is empty. <Link className="font-bold text-[#5d8414]" to="/">Shop now</Link></div> : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Delivery address</h2><button onClick={() => setShowForm(!showForm)} className="text-sm font-bold text-[#5d8414]">{showForm ? "Cancel" : "+ Add new"}</button></div>
              {showForm && <form onSubmit={saveAddress} className="mt-4 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={useCurrentLocation} disabled={locating} className="flex items-center justify-center gap-2 rounded-xl border border-lime-300 bg-lime-50 p-3 text-sm font-bold text-lime-900 transition hover:bg-lime-100 disabled:opacity-60 sm:col-span-2">{locating ? "Detecting your location…" : "◎ Use my current location"}</button>
                <input required placeholder="House / street / area" value={form.address_line} onChange={e => setForm({...form,address_line:e.target.value})} className="rounded-lg border p-3 text-sm sm:col-span-2" />
                <input required placeholder="City" value={form.city} onChange={e => setForm({...form,city:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <input required placeholder="State" value={form.state} onChange={e => setForm({...form,state:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <input required maxLength="6" placeholder="6-digit pincode" value={form.pincode} onChange={e => setForm({...form,pincode:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <input required placeholder="Mobile number" maxLength="10" value={form.mobile} onChange={e => setForm({...form,mobile:e.target.value})} className="rounded-lg border p-3 text-sm" />
                <button disabled={saving} className="rounded-lg bg-[#c9f24a] text-[#1c2715] p-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">{saving ? "Saving…" : "Save address"}</button>
              </form>}
              <div className="mt-4 space-y-3">
                {addresses.map(address => <label key={address._id} className={"flex cursor-pointer gap-3 rounded-xl border p-4 " + (selected === address._id ? "border-[#9acb28] bg-[#f4fbe5]" : "border-gray-200")}>
                  <input type="radio" name="address" checked={selected === address._id} onChange={() => setSelected(address._id)} className="mt-1 accent-[#7aa91c]" />
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
              <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-3 text-sm"><label className="flex cursor-pointer items-center gap-2 font-semibold"><input type="radio" name="paymentMethod" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} /> Cash on Delivery</label>{paymentMethod === "COD" && <div className="rounded-lg border border-lime-200 bg-lime-50 p-3 text-xs leading-5 text-lime-950"><strong>Pay when your order arrives.</strong><p className="mt-1">We accept Cash on Delivery. We will use your selected delivery address and mobile number to bring your order to your doorstep. Please pay the order total in cash to the delivery partner at the time of delivery.</p></div>}<label className="flex cursor-pointer items-center gap-2"><input type="radio" name="paymentMethod" checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} /> Pay online with Razorpay</label></div>
              <button disabled={saving || !selected} onClick={paymentMethod === "COD" ? placeOrder : payOnline} className="mt-5 w-full rounded-xl bg-[#c9f24a] px-4 py-3 font-extrabold text-[#1c2715] disabled:opacity-50">{saving ? "Processing…" : paymentMethod === "COD" ? "Place COD order" : "Pay securely"}</button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
