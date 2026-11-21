import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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


const benefitSlides = [
  { eyebrow: "THE PRIME PROMISE", title: "Fresh picks. Happier days.", description: "Everyday essentials selected for your home, with a smooth and simple shopping experience.", icon: "🥬", points: ["Everyday essentials", "Easy secure checkout"] },
  { eyebrow: "MEMBER-ONLY SAVINGS", title: "Little prices. Big smiles.", description: "Discover the latest discounts added by our store team and save on the things you love.", icon: "🏷️", points: ["Live product offers", "Clear savings on every deal"] },
  { eyebrow: "SHOP WITHOUT THE STRESS", title: "Your basket, your way.", description: "Find favourites fast, manage your basket easily and keep your orders close at hand.", icon: "🛵", points: ["Quick, simple ordering", "Order updates in one place"] },
];

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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [activeBenefit, setActiveBenefit] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveBenefit((current) => (current + 1) % benefitSlides.length), 5200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([Axios.get("/api/v1/products?limit=60"), Axios.get("/api/v1/categories")])
      .then(([productResponse, categoryResponse]) => {
        if (!active) return;
        const rows = productResponse.data?.data || [];
        setProducts(rows.map((product) => ({
          ...product,
          id: product.id || product._id,
          categoryName: Array.isArray(product.categoryId) ? product.categoryId.map((category) => category?.name).filter(Boolean).join(", ") : "",
        })));
        setCategories(categoryResponse.data?.data || []);
        setLoadError(false);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
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
    const query = search.toLowerCase().trim();
    return matchesCategory && (!query || product.name.toLowerCase().includes(query) || (product.categoryName || "").toLowerCase().includes(query));
  }), [products, activeCategory, search]);

  const offerProducts = useMemo(() => products
    .filter((product) => Number(product.discountPercent) > 0 && product.publish !== false && Number(product.stock ?? 1) > 0)
    .sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent))
    .slice(0, 8), [products]);

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
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-12 lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-lime-200/25 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[.2em] text-lime-200"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> PRIME COMMERCE · EVERYDAY MADE BETTER</span>{user?.name && <span className="text-xs font-semibold text-emerald-50/75">Welcome back, {user.name.split(" ")[0]}</span>}</div>
            <h1 className="mt-5 text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">Good food.<br /><span className="text-lime-300">Great days.</span></h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-emerald-50/75 sm:text-base">Your everyday groceries and home essentials, brought together in one thoughtful shopping experience.</p>
            <div className="mt-7 overflow-hidden rounded-[26px] border border-white/10 bg-white/[.07] p-5 shadow-2xl backdrop-blur-xl sm:p-6" aria-live="polite">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-lime-300 text-3xl shadow-lg shadow-lime-950/20">{benefitSlides[activeBenefit].icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold tracking-[.2em] text-lime-300">{benefitSlides[activeBenefit].eyebrow}</p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">{benefitSlides[activeBenefit].title}</h2>
                  <p className="mt-2 text-xs leading-6 text-emerald-50/70 sm:text-sm">{benefitSlides[activeBenefit].description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{benefitSlides[activeBenefit].points.map((point) => <span key={point} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/85">✓ {point}</span>)}</div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">{benefitSlides.map((slide, index) => <button key={slide.eyebrow} type="button" onClick={() => setActiveBenefit(index)} aria-label={`Show benefit ${index+1}`} aria-pressed={activeBenefit===index} className={`h-1.5 rounded-full transition-all ${activeBenefit===index?"w-8 bg-lime-300":"w-3 bg-white/30 hover:bg-white/60"}`} />)}</div>
                <div className="flex gap-2"><button type="button" onClick={() => setActiveBenefit((activeBenefit + benefitSlides.length - 1) % benefitSlides.length)} aria-label="Previous benefit" className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-sm hover:bg-white/10">←</button><button type="button" onClick={() => setActiveBenefit((activeBenefit + 1) % benefitSlides.length)} aria-label="Next benefit" className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-sm hover:bg-white/10">→</button></div>
              </div>
            </div>
          </div>
          <div className="rounded-[30px] border border-white/15 bg-white p-3 text-slate-900 shadow-[0_28px_80px_rgba(0,0,0,.25)] sm:p-4">
            <div className="rounded-[22px] bg-[#f5f7f1] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-700">Find your favourites</p><h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">What’s on your list?</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-200 text-2xl">⌕</span></div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <span className="text-xl text-emerald-700">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && navigate(`/search?q=${encodeURIComponent(search)}`)} placeholder="Search milk, fruits, snacks..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" aria-label="Search products" />
                {search && <button onClick={() => setSearch("")} className="text-xs font-bold text-emerald-700">Clear</button>}
              </div>
              <p className="mt-3 text-xs text-slate-500">Search across your store’s live catalogue.</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white p-3"><span className="text-xl">🥦</span><p className="mt-1 text-[10px] font-bold text-slate-600">Fresh picks</p></div>
                <div className="rounded-xl bg-white p-3"><span className="text-xl">🏷️</span><p className="mt-1 text-[10px] font-bold text-slate-600">Live offers</p></div>
                <div className="rounded-xl bg-white p-3"><span className="text-xl">🛒</span><p className="mt-1 text-[10px] font-bold text-slate-600">Easy checkout</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <section className="pb-8 pt-2">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">A little inspiration</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">The Prime collection <span className="text-xl">✦</span></h2><p className="mt-1 text-sm text-slate-500">A preview of everyday essentials in our signature shopping style.</p></div>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">Sample showcase</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "Farm Fresh Avocados", category: "Fresh produce", unit: "2 pcs", price: 89, mrp: 110, icon: "🥑", bg: "from-lime-50 to-emerald-100", tag: "Farm pick" },
              { name: "Organic A2 Milk", category: "Dairy & breakfast", unit: "500 ml", price: 42, mrp: 50, icon: "🥛", bg: "from-sky-50 to-blue-100", tag: "Daily essential" },
              { name: "Premium Strawberries", category: "Fresh produce", unit: "1 box", price: 119, mrp: 149, icon: "🍓", bg: "from-rose-50 to-pink-100", tag: "Fresh choice" },
              { name: "Artisan Sourdough", category: "Bakery", unit: "400 g", price: 99, mrp: 125, icon: "🍞", bg: "from-amber-50 to-orange-100", tag: "Bakery pick" },
            ].map((item) => (
              <article key={item.name} className="group overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,.10)]">
                <div className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${item.bg} sm:h-40`}>
                  <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">{item.tag}</span>
                  <span className="text-6xl drop-shadow-sm transition duration-300 group-hover:scale-110" role="img" aria-label={item.name}>{item.icon}</span>
                </div>
                <div className="p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{item.category}</p>
                  <h3 className="mt-1 min-h-10 text-sm font-extrabold leading-5 text-slate-900">{item.name}</h3>
                  <div className="mt-3 flex items-end justify-between gap-2"><div><p className="text-base font-black text-slate-950">₹{item.price}</p><p className="text-[11px] text-slate-400 line-through">₹{item.mrp}</p></div><span className="rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] font-semibold text-slate-500">{item.unit}</span></div>
                  <p className="mt-3 border-t border-slate-100 pt-2 text-[9px] font-semibold text-slate-400">DEMO PREVIEW · NOT FOR CHECKOUT</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-8 pt-9 sm:pt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">Find your next favourite</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Shop by category ✦</h2><p className="mt-1 text-sm text-slate-500">Thoughtfully grouped essentials for every part of your day.</p></div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-slate-500">Category preview</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "Fresh produce", note: "Bright & seasonal", icon: "🥑", style: "from-lime-50 via-green-50 to-emerald-100", accent: "text-emerald-800" },
              { name: "Dairy & eggs", note: "Everyday goodness", icon: "🥛", style: "from-sky-50 via-blue-50 to-indigo-100", accent: "text-blue-800" },
              { name: "Snacks & munchies", note: "Little treats", icon: "🍿", style: "from-orange-50 via-amber-50 to-yellow-100", accent: "text-orange-800" },
              { name: "Drinks & juices", note: "Sip something fresh", icon: "🧃", style: "from-cyan-50 via-teal-50 to-emerald-100", accent: "text-teal-800" },
              { name: "Bakery favourites", note: "Oven fresh picks", icon: "🥐", style: "from-amber-50 via-yellow-50 to-orange-100", accent: "text-amber-900" },
              { name: "Home essentials", note: "For every corner", icon: "🧺", style: "from-violet-50 via-fuchsia-50 to-pink-100", accent: "text-violet-800" },
            ].map((category) => (
              <article key={category.name} className={`group relative overflow-hidden min-h-[164px] rounded-[26px] border border-white/90 bg-gradient-to-br ${category.style} p-4 shadow-[0_10px_28px_rgba(15,23,42,.06)] ring-1 ring-slate-900/[.025] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,.10)] sm:p-5`}>
                <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/35 blur-xl transition group-hover:scale-125" />
                <div className="relative flex items-start justify-between gap-2"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/65 text-3xl shadow-sm">{category.icon}</span><span className="rounded-full bg-white/65 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-slate-500">Sample</span></div>
                <h3 className={`relative mt-5 text-sm font-black leading-5 ${category.accent}`}>{category.name}</h3>
                <p className="relative mt-1 text-[10px] font-medium text-slate-500">{category.note}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-400">Illustrative category cards. Live store categories appear below when configured by the admin.</p>
        </section>

        <section className="py-8 sm:py-10">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-700">From your store catalogue</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Shop live categories</h2></div><button onClick={() => setActiveCategory("All")} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-800">View all</button></div>
          {categories.length ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {categories.map((category) => { const visual = visualFor(category.name); return <button key={category._id} onClick={() => { setActiveCategory(category._id); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="group flex flex-col items-center gap-2 rounded-2xl border border-transparent p-3 text-center transition hover:border-gray-100 hover:bg-white hover:shadow-md"><span className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl text-3xl transition group-hover:scale-105 ${visual.color}`}>{category.image ? <img src={category.image} alt="" className="h-full w-full object-cover" /> : visual.emoji}</span><span className="text-[11px] font-semibold leading-4 text-gray-700">{category.name}</span></button>; })}
          </div> : <p className="rounded-xl bg-white p-5 text-sm text-gray-500">Categories will appear here when the store catalogue is configured.</p>}
        </section>

        <section className="relative isolate mb-5 overflow-hidden rounded-[30px] bg-[#102b20] px-4 py-7 text-white shadow-[0_22px_55px_rgba(16,43,32,.16)] sm:px-7 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-lime-300/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-lime-300">A little more for less</p><h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Offers you’ll love <span className="text-xl">✦</span></h2><p className="mt-1 max-w-xl text-sm text-emerald-50/70">Handpicked deals and real savings from the live Prime Commerce catalogue.</p></div>
            <button onClick={() => { setActiveCategory("All"); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white backdrop-blur transition hover:bg-white hover:text-emerald-900">Shop all deals →</button>
          </div>
          {offerProducts.length ? <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{offerProducts.map((product) => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity || 0} onAdd={addProduct} onChange={updateCart} />)}</div> : <div className="relative rounded-2xl border border-white/10 bg-white/[.07] px-5 py-7 text-center backdrop-blur"><span className="text-3xl">🏷️</span><h3 className="mt-2 text-base font-extrabold text-white">Fresh deals are on their way</h3><p className="mt-1 text-xs text-emerald-50/65">Offers published by the store team will appear here automatically.</p></div>}
        </section>

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
          : <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">🛍️</p><h3 className="mt-2 font-bold">{search ? "No products found" : "Your store is getting ready"}</h3><p className="mt-1 text-sm text-gray-500">{search ? "Try another product or category." : "Products added by your store admin will appear here."}</p></div>}
        </section>

      </div>

      {cartCount > 0 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div><p className="text-sm font-bold">{cartCount} {cartCount === 1 ? "item" : "items"} in your cart</p><p className="text-xs text-gray-500">Subtotal · ₹{cartTotal}</p></div><button onClick={() => navigate("/cart")} className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800">View cart <span className="ml-2">→</span></button></div></div>}
    </div>
  );
}
