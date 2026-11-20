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
    <main className="min-h-[65vh] bg-[#fafaf7] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="text-sm font-semibold text-green-700">← Continue shopping</Link>
        <h1 className="mt-3 text-2xl font-extrabold">My basket</h1>
        {!cart.items.length ? (
          <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🛒</div><h2 className="mt-3 text-lg font-bold">Your basket is empty</h2>
            <p className="mt-1 text-sm text-gray-500">Add a few everyday essentials to get started.</p>
            <Link to="/" className="mt-5 inline-flex rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white">Explore products</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
            <section className="space-y-3">
              {cart.items.map((item) => (
                <article key={item.cartItemId} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                    {item.product.image?.[0] ? <img src={item.product.image[0]} alt={item.product.name} className="h-full w-full rounded-xl object-contain p-2" /> : <span className="text-4xl">🛍️</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900">{item.product.name}</h2><p className="mt-1 text-xs text-gray-500">{item.product.unit}</p>
                    <p className="mt-2 font-bold">₹{item.product.price} <span className="text-xs font-normal text-gray-400">per unit</span></p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 rounded-lg border border-green-700 bg-green-700 px-3 py-1 text-white">
                        <button disabled={busyId === item.cartItemId} onClick={() => changeQuantity(item, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                        <span className="text-sm font-bold">{item.quantity}</span>
                        <button disabled={busyId === item.cartItemId || item.quantity >= item.product.stock} onClick={() => changeQuantity(item, item.quantity + 1)} aria-label="Increase quantity">+</button>
                      </div>
                      <p className="font-bold">₹{item.lineTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold">Bill summary</h2>
              <div className="mt-4 flex justify-between text-sm text-gray-600"><span>Items ({cart.itemCount})</span><span>₹{cart.subtotal.toFixed(2)}</span></div>
              <div className="mt-3 flex justify-between text-sm text-gray-600"><span>Delivery fee</span><span>Calculated at checkout</span></div>
              <div className="my-4 border-t border-dashed" />
              <div className="flex justify-between font-extrabold"><span>Subtotal</span><span>₹{cart.subtotal.toFixed(2)}</span></div>
              <button onClick={() => navigate("/checkout")} className="mt-5 w-full rounded-xl bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800">Proceed to checkout</button>
              <p className="mt-3 text-center text-[11px] text-gray-400">Final amount is recalculated securely before order placement.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
