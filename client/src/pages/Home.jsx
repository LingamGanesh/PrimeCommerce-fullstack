import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

const categoryVisuals = [
  ["vegetable|fruit|produce", "🥦", "bg-green-50"],
  ["dairy|milk|bread|egg", "🥛", "bg-blue-50"],
  ["snack|munch|chip", "🍿", "bg-orange-50"],
  ["drink|beverage|juice", "🥤", "bg-cyan-50"],
  ["breakfast|cereal|oat", "🥣", "bg-amber-50"],
  ["bakery|biscuit", "🍞", "bg-yellow-50"],
  ["atta|rice|dal|grain", "🌾", "bg-lime-50"],
  ["personal|beauty|care", "🧴", "bg-pink-50"],
  ["clean|home", "🧹", "bg-violet-50"],
  ["baby", "🍼", "bg-sky-50"],
  ["pet", "🐾", "bg-orange-50"],
];

const visualFor = (value = "") => {
  const match = categoryVisuals.find(([words]) => words.split("|").some((word) => value.toLowerCase().includes(word)));
  return match ? { emoji: match[1], color: match[2] } : { emoji: "🛍️", color: "bg-stone-50" };
};


function ProductCarousel({ id, products, cart, onAdd, onChange, emptyTitle, emptyText }) {
  const scroll = (direction) => document.getElementById(id)?.scrollBy({ left: direction * 520, behavior: "smooth" });
  return (
    <div className="relative">
      {products.length ? <>
        <div className="mb-3 flex justify-end gap-2">
          <button type="button" onClick={() => scroll(-1)} aria-label="Scroll products left" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700">←</button>
          <button type="button" onClick={() => scroll(1)} aria-label="Scroll products right" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700">→</button>
        </div>
        <div id={id} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => <div key={product.id} className="w-[220px] min-w-[220px] snap-start sm:w-[245px] sm:min-w-[245px]"><ProductCard product={product} quantity={cart[product.id]?.quantity || 0} onAdd={onAdd} onChange={onChange} /></div>)}
        </div>
      </> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-5 py-8 text-center"><span className="text-3xl">🌱</span><h3 className="mt-2 text-sm font-extrabold text-slate-800">{emptyTitle}</h3><p className="mt-1 text-xs text-slate-500">{emptyText}</p></div>}
    </div>
  );
}

function readCart() { return {}; }

function ProductCard({ product, quantity, onAdd, onChange }) {
  const visual = visualFor(product.name + " " + (product.categoryName || ""));
  const image = product.images?.[0] || product.image?.[0];
  const discount = product.discountPercent || 0;
  return (
    <article className="group relative min-w-0 overflow-hidden rounded-[24px] border border-slate-100/90 bg-white shadow-[0_8px_28px_rgba(15,23,42,.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_20px_44px_rgba(15,23,42,.12)]">
      <div className={`relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br ${visual.color} sm:h-44`}>
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/45 blur-2xl" />
        {discount > 0 && <span className="absolute left-3 top-3 z-10 rounded-full bg-[#176b3b] px-3 py-1.5 text-[9px] font-extrabold tracking-wide text-white shadow-sm">{discount}% SAVING</span>}
        {image ? <img src={image} alt={product.name} className="relative h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" loading="lazy" /> : <span className="relative text-6xl drop-shadow-sm transition-transform duration-500 group-hover:scale-110" role="img" aria-label={product.name}>{visual.emoji}</span>}
        <span className="absolute bottom-3 right-3 rounded-full border border-white/70 bg-white/75 px-2.5 py-1 text-[9px] font-bold text-slate-600 backdrop-blur">{product.unit || "Everyday pick"}</span>
      </div>
      <div className="p-3.5 sm:p-4">
        <p className="mb-1.5 line-clamp-1 text-[9px] font-extrabold uppercase tracking-[.16em] text-emerald-700">{product.categoryName || "Daily essentials"}</p>
        <h3 className="min-h-10 text-[13px] font-extrabold leading-5 text-slate-900 sm:text-sm">{product.name}</h3>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="min-w-0"><p className="text-base font-black tracking-tight text-slate-950">₹{product.price}</p>{product.mrp > product.price && <p className="text-[10px] font-medium text-slate-400 line-through">₹{product.mrp}</p>}</div>
          {quantity > 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-[#176b3b] px-3 py-2 text-white shadow-sm">
              <button aria-label={`Remove one ${product.name}`} onClick={() => onChange(product.id, -1)} className="font-bold">−</button>
              <span className="min-w-3 text-center text-xs font-extrabold">{quantity}</span>
              <button aria-label={`Add one ${product.name}`} onClick={() => onChange(product.id, 1)} className="font-bold">+</button>
            </div>
          ) : <button onClick={() => onAdd(product)} className="rounded-xl border border-emerald-700/20 bg-emerald-50 px-4 py-2 text-[10px] font-extrabold tracking-[.12em] text-emerald-800 transition hover:border-emerald-700 hover:bg-emerald-700 hover:text-white">ADD +</button>}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [cart, setCart] = useState(readCart);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const loadCatalogue = async () => {
      try {
        const productResponse = await Axios.get("/api/v1/products?limit=60");
        if (!active) return;
        const rows = productResponse.data?.data;
        if (!Array.isArray(rows)) throw new Error("Products response is not a valid list");
        setProducts(rows.map((product) => ({
          ...product,
          id: product.id || product._id,
          categoryName: Array.isArray(product.categoryId) ? product.categoryId.map((category) => category?.name).filter(Boolean).join(", ") : "",
          discountPercent: Number(product.discountPercent ?? product.discount ?? 0),
          images: product.images || product.image || [],
        })));
        setLoadError(false);
      } catch (error) {
        if (active) {
          setLoadError(true);
          console.error("Store products could not be loaded:", error.response?.status, error.response?.data || error.message);
        }
      } finally {
        if (active) setLoading(false);
      }

      try {
        const categoryResponse = await Axios.get("/api/v1/categories");
        if (active) setCategories(Array.isArray(categoryResponse.data?.data) ? categoryResponse.data.data : []);
      } catch (error) {
        if (active) {
          setCategories([]);
          console.error("Store categories could not be loaded:", error.response?.status, error.response?.data || error.message);
        }
      }
    };
    loadCatalogue();
    return () => { active = false; };
  }, []);

  const refreshCart = useCallback(async () => {
    if (!user?._id) { setCart({}); return; }
    try {
      const response = await Axios.get("/api/v1/cart");
      const next = {};
      for (const item of response.data?.data?.items || []) next[item.product.id] = { quantity: item.quantity, cartItemId: item.cartItemId };
      setCart(next);
    } catch { setCart({}); }
  }, [user?._id]);
  useEffect(() => { refreshCart(); }, [refreshCart]);
  const cartCount = Object.values(cart).reduce((sum, entry) => sum + entry.quantity, 0);
  const cartTotal = products.reduce((sum, product) => sum + product.price * (cart[product.id]?.quantity || 0), 0);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const categoryIds = (product.categoryId || []).map((category) => typeof category === "object" ? category?._id : category);
    const matchesCategory = activeCategory === "All" || categoryIds.includes(activeCategory);
    return matchesCategory;
  }), [products, activeCategory]);

  const availableProducts = useMemo(() => products.filter((product) => product.publish !== false && Number(product.stock ?? 0) > 0), [products]);
  const freshArrivals = useMemo(() => [...availableProducts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 10), [availableProducts]);
  const offerProducts = useMemo(() => {
    const now = Date.now();
    return availableProducts.filter((product) => Number(product.discountPercent) > 0 && (!product.offerStartsAt || new Date(product.offerStartsAt).getTime() <= now) && (!product.offerEndsAt || new Date(product.offerEndsAt).getTime() > now))
      .sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent)).slice(0, 10);
  }, [availableProducts]);
  const upcomingOffers = useMemo(() => {
    const now = Date.now();
    return availableProducts.filter((product) => Number(product.discountPercent) > 0 && product.offerStartsAt && new Date(product.offerStartsAt).getTime() > now && (!product.offerEndsAt || new Date(product.offerEndsAt).getTime() > new Date(product.offerStartsAt).getTime()))
      .sort((a, b) => new Date(a.offerStartsAt) - new Date(b.offerStartsAt)).slice(0, 10);
  }, [availableProducts]);

  const recommendedProducts = useMemo(() => {
    const cartProductIds = new Set(Object.entries(cart).filter(([, item]) => item.quantity > 0).map(([id]) => id));
    const preferredCategories = new Set(
      products
        .filter((product) => cartProductIds.has(String(product.id)))
        .flatMap((product) => (product.categoryId || []).map((category) => String(typeof category === "object" ? category?._id : category)))
        .filter(Boolean)
    );
    const inStock = products.filter((product) => product.publish !== false && Number(product.stock ?? 1) > 0 && !cartProductIds.has(String(product.id)));
    const personalized = preferredCategories.size
      ? inStock.filter((product) => (product.categoryId || []).some((category) => preferredCategories.has(String(typeof category === "object" ? category?._id : category))))
      : [];
    return (personalized.length ? personalized : inStock).slice(0, 6);
  }, [products, cart]);

  const hasPersonalizedRecommendations = Object.values(cart).some((item) => item.quantity > 0);

  const updateCart = async (id, delta) => {
    if (!user?._id) { toast.error("Please login to add products"); navigate("/login"); return; }
    const entry = cart[id];
    if (!entry) return;
    setCartBusy(true);
    try {
      const quantity = Math.max(0, entry.quantity + delta);
      if (quantity === 0) await Axios.delete("/api/v1/cart/items/" + entry.cartItemId);
      else await Axios.patch("/api/v1/cart/items/" + entry.cartItemId, { quantity });
      await refreshCart();
    } catch (error) { toast.error(error.response?.data?.message || "Unable to update cart"); }
    finally { setCartBusy(false); }
  };
  const addProduct = async (product) => {
    if (!user?._id) { toast.error("Please login to add products"); navigate("/login"); return; }
    if (cartBusy) return;
    setCartBusy(true);
    try {
      await Axios.post("/api/v1/cart/items", { productId: product.id, quantity: 1 });
      await refreshCart();
      toast.success(product.name + " added to cart");
    } catch (error) { toast.error(error.response?.data?.message || "Unable to add product"); }
    finally { setCartBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-900">
      <section className="relative isolate overflow-hidden bg-[#102b20] text-white">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-200/25 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[.2em] text-lime-200"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> PRIME COMMERCE</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">Everyday essentials.<br /><span className="text-lime-300">A better way to shop.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-emerald-50/75 sm:text-base">Fresh groceries and home essentials, all in one place. Find what you need and make your everyday shopping simple.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })} className="rounded-xl bg-lime-300 px-6 py-3 text-sm font-extrabold text-[#102b20] shadow-lg shadow-black/10 transition hover:bg-lime-200">Shop now <span className="ml-2">→</span></button>
            {user?.name && <span className="text-xs font-semibold text-emerald-50/70">Welcome back, {user.name.split(" ")[0]}</span>}
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 text-xs font-semibold text-emerald-50/75">
            <span><span className="mr-2 text-lime-300">✓</span>Everyday essentials</span>
            <span><span className="mr-2 text-lime-300">✓</span>Simple checkout</span>
            <span><span className="mr-2 text-lime-300">✓</span>Track your orders</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <section className="py-8 sm:py-10">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">Just landed in store</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Fresh arrivals <span>🌿</span></h2><p className="mt-1 text-sm text-slate-500">The latest products added by our store team.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-800">NEW IN</span></div>
          {loading ? <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> : <ProductCarousel id="fresh-arrivals-carousel" products={freshArrivals} cart={cart} onAdd={addProduct} onChange={updateCart} emptyTitle="Fresh picks are on the way" emptyText="New products added by the admin will appear here." />}
        </section>

        <section className="relative isolate mb-7 overflow-hidden rounded-[30px] bg-[#102b20] px-4 py-7 text-white shadow-[0_22px_55px_rgba(16,43,32,.16)] sm:px-7 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-lime-300/15 blur-3xl" />
          <div className="relative mb-2 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-lime-300">Lovely deals, live right now</p><h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Offers you’ll love <span>💚</span></h2><p className="mt-1 text-sm text-emerald-50/70">Current discounts published by your store team.</p></div><span className="rounded-full border border-lime-200/20 bg-lime-300/10 px-3 py-1.5 text-[10px] font-bold text-lime-200">LIVE OFFERS</span></div>
          <ProductCarousel id="live-offers-carousel" products={offerProducts} cart={cart} onAdd={addProduct} onChange={updateCart} emptyTitle="Fresh deals are on their way" emptyText="Admin-published discounts will appear here while they are active." />
        </section>

        {upcomingOffers.length > 0 && <section className="mb-8 overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-[#f8f5ff] via-white to-[#fff7f1] p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-violet-600">A little something to look forward to</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Coming soon <span>✨</span></h2><p className="mt-1 text-sm text-slate-500">Sneak peek at offers scheduled by our admin team.</p></div><span className="rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-extrabold text-violet-700">UPCOMING</span></div>
          <div className="mb-3 flex justify-end gap-2"><button type="button" onClick={() => document.getElementById("upcoming-offers-carousel")?.scrollBy({left:-520,behavior:"smooth"})} aria-label="Scroll upcoming offers left" className="grid h-9 w-9 place-items-center rounded-full border border-violet-100 bg-white text-violet-700">←</button><button type="button" onClick={() => document.getElementById("upcoming-offers-carousel")?.scrollBy({left:520,behavior:"smooth"})} aria-label="Scroll upcoming offers right" className="grid h-9 w-9 place-items-center rounded-full border border-violet-100 bg-white text-violet-700">→</button></div>
          <div id="upcoming-offers-carousel" className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {upcomingOffers.map((product) => <article key={product.id} className="flex w-[245px] min-w-[245px] snap-start items-center gap-3 rounded-2xl border border-violet-100 bg-white/90 p-3 shadow-sm sm:w-[285px] sm:min-w-[285px]"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-violet-50 text-3xl">{(product.images?.[0] || product.image?.[0]) ? <img src={product.images?.[0] || product.image?.[0]} alt={product.name} className="h-full w-full object-contain p-2" /> : visualFor(product.name).emoji}</div><div className="min-w-0"><span className="rounded-full bg-violet-100 px-2 py-1 text-[9px] font-extrabold text-violet-700">{product.discountPercent}% OFF SOON</span><h3 className="mt-2 line-clamp-2 text-sm font-extrabold text-slate-900">{product.name}</h3><p className="mt-1 text-[10px] font-semibold text-slate-500">Starts {new Date(product.offerStartsAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p></div></article>)}
          </div>
        </section>}

        {recommendedProducts.length > 0 && <section className="pb-8 pt-2">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">{hasPersonalizedRecommendations ? "Inspired by your basket" : "Popular in our store"}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{hasPersonalizedRecommendations ? "Picked for you" : "Popular picks to get started"} <span className="text-xl">💚</span></h2>
              <p className="mt-1 text-sm text-slate-500">{hasPersonalizedRecommendations ? "More essentials from categories you already shop." : "Explore customer favourites from our current catalogue."}</p>
            </div>
            <button onClick={() => { setActiveCategory("All"); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-800">Explore catalogue →</button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">{recommendedProducts.map((product) => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity || 0} onAdd={addProduct} onChange={updateCart} />)}</div>
        </section>}

        <section id="products" className="py-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Handpicked for your home</p><h2 className="mt-1 text-2xl font-black tracking-tight">{activeCategory === "All" ? "Popular products" : categories.find((category) => category._id === activeCategory)?.name || "Products"}</h2></div>
            <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none"><option value="All">All categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>
          </div>
          {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /></div>
          : loadError ? <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">⚠️</p><h3 className="mt-2 font-bold">Store catalogue is unavailable</h3><p className="mt-1 text-sm text-gray-500">Please check the server connection and try again.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">Retry</button></div>
          : visibleProducts.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity || 0} onAdd={addProduct} onChange={updateCart} />)}</div>
          : <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">🛍️</p><h3 className="mt-2 font-bold">Your store is getting ready</h3><p className="mt-1 text-sm text-gray-500">Products added by your store admin will appear here.</p></div>}
        </section>

      </div>

      {cartCount > 0 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div><p className="text-sm font-bold">{cartCount} {cartCount === 1 ? "item" : "items"} in your cart</p><p className="text-xs text-gray-500">Subtotal · ₹{cartTotal}</p></div><button onClick={() => navigate("/cart")} className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800">View cart <span className="ml-2">→</span></button></div></div>}
    </div>
  );
}
