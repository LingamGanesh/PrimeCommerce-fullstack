import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const loadCart = async () => {
    try {
      const response = await Axios.get("/api/v1/cart");
      setCart(response.data?.data || { items: [], subtotal: 0, itemCount: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Please login to view your cart");
      setCart({ items: [], subtotal: 0, itemCount: 0 });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadCart(); }, []);

  const changeQuantity = async (item, quantity) => {
    setBusyId(item.cartItemId);
    try {
      if (quantity <= 0) await Axios.delete("/api/v1/cart/items/" + item.cartItemId);
      else await Axios.patch("/api/v1/cart/items/" + item.cartItemId, { quantity });
      await loadCart();
    } catch (error) { toast.error(error.response?.data?.message || "Unable to update item"); }
    finally { setBusyId(""); }
  };

  if (loading) return <div className="mx-auto max-w-5xl p-8 text-center text-gray-500">Loading your basket…</div>;

  return (
    <main className="min-h-[70vh] bg-[#f7f8f3] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-green-700">← Continue shopping</Link>
        <div className="mt-5 overflow-hidden rounded-3xl bg-[#123d2a] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-lime-300">Your quick-commerce basket</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">My basket</h1><p className="mt-2 text-sm text-green-100">Your everyday essentials, ready when you are.</p></div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3"><p className="text-xs text-green-100">Items in basket</p><p className="mt-1 text-2xl font-black">{cart.itemCount || cart.items.length}</p></div>
          </div>
        </div>
        {!cart.items.length ? (
          <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🛒</div><h2 className="mt-3 text-lg font-bold">Your basket is empty</h2>
            <p className="mt-1 text-sm text-gray-500">Add a few everyday essentials to get started.</p>
            <Link to="/" className="mt-5 inline-flex rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white">Explore products</Link>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1"><h2 className="text-lg font-black text-slate-900">Your items</h2><span className="text-xs font-semibold text-slate-500">{cart.items.length} products</span></div>
              {cart.items.map((item) => (
                <article key={item.cartItemId} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:shadow-md sm:gap-4 sm:p-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#f7f8f3] sm:h-28 sm:w-28">
                    {item.product.image?.[0] ? <img src={item.product.image[0]} alt={item.product.name} className="h-full w-full rounded-xl object-contain p-2" /> : <span className="text-4xl">🛍️</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-extrabold leading-snug text-slate-900">{item.product.name}</h2><p className="mt-1 text-xs text-slate-500">{item.product.unit}</p>
                    <p className="mt-2 font-bold text-slate-900">₹{Number(item.product.price || 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">per unit</span></p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 rounded-xl border border-green-800 bg-green-800 px-3 py-2 text-white shadow-sm">
                        <button type="button" disabled={busyId === item.cartItemId} onClick={() => changeQuantity(item, item.quantity - 1)} aria-label="Decrease quantity" className="text-lg font-bold leading-none disabled:opacity-40">−</button>
                        <span className="min-w-4 text-center text-sm font-extrabold">{item.quantity}</span>
                        <button type="button" disabled={busyId === item.cartItemId || (Number.isFinite(Number(item.product.stock)) && item.quantity >= Number(item.product.stock))} onClick={() => changeQuantity(item, item.quantity + 1)} aria-label="Increase quantity" className="text-lg font-bold leading-none disabled:opacity-40">+</button>
                      </div>
                      <p className="font-extrabold text-slate-900">₹{Number(item.lineTotal || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-green-700">Order total</p><h2 className="mt-1 text-xl font-black text-slate-900">Bill summary</h2>
              <div className="mt-5 flex justify-between text-sm text-slate-600"><span>Items ({cart.itemCount || cart.items.length})</span><span className="font-semibold">₹{Number(cart.subtotal || 0).toFixed(2)}</span></div>
              <div className="mt-3 flex justify-between gap-3 text-sm text-slate-600"><span>Delivery fee</span><span className="text-right text-xs font-semibold text-slate-500">Calculated at checkout</span></div>
              <div className="my-5 border-t border-dashed border-slate-200" />
              <div className="flex items-center justify-between text-lg font-black text-slate-950"><span>Subtotal</span><span>₹{Number(cart.subtotal || 0).toFixed(2)}</span></div>
              <button onClick={() => navigate("/checkout")} className="mt-5 w-full rounded-xl bg-[#123d2a] px-4 py-3.5 font-extrabold text-white shadow-sm transition hover:bg-green-900">Proceed to checkout →</button>
              <div className="mt-4 rounded-xl bg-[#f4f8ee] p-3 text-xs leading-5 text-slate-600"><span className="font-extrabold text-green-800">Good to know</span><br />Your final amount is recalculated securely at checkout. Delivery charges, if applicable, are shown before you place your order.</div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
