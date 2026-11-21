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
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`relative flex h-36 items-center justify-center overflow-hidden sm:h-40 ${visual.color}`}>
        {discount > 0 && <span className="absolute left-2 top-2 z-10 rounded-md bg-green-700 px-2 py-1 text-[10px] font-bold text-white">{discount}% OFF</span>}
        {image ? <img src={image} alt={product.name} className="h-full w-full object-contain p-3" loading="lazy" /> : <span className="text-6xl" role="img" aria-label={product.name}>{visual.emoji}</span>}
      </div>
      <div className="p-3">
        <p className="mb-1 line-clamp-1 text-[11px] font-medium text-green-700">{product.categoryName || "Daily essentials"}</p>
        <h3 className="min-h-10 text-sm font-semibold leading-5 text-gray-800">{product.name}</h3>
        <p className="mt-1 text-xs text-gray-500">{product.unit}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div><p className="text-sm font-bold text-gray-900">₹{product.price}</p>{product.mrp > product.price && <p className="text-[11px] text-gray-400 line-through">₹{product.mrp}</p>}</div>
          {quantity > 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-700 bg-green-700 px-2 py-1 text-white">
              <button aria-label={`Remove one ${product.name}`} onClick={() => onChange(product.id, -1)} className="font-bold">−</button>
              <span className="min-w-3 text-center text-sm font-bold">{quantity}</span>
              <button aria-label={`Add one ${product.name}`} onClick={() => onChange(product.id, 1)} className="font-bold">+</button>
            </div>
          ) : <button onClick={() => onAdd(product)} className="rounded-lg border border-green-700 bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-green-800 transition hover:bg-green-700 hover:text-white">ADD</button>}
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
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-200/25 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[.2em] text-lime-200"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> PRIME COMMERCE · EVERYDAY MADE BETTER</span>
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
        <section className="py-8 sm:py-10">
          <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Browse by department</p><h2 className="mt-1 text-2xl font-black tracking-tight">Shop by category</h2></div><button onClick={() => setActiveCategory("All")} className="text-xs font-bold text-green-800">View all</button></div>
          {categories.length ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {categories.map((category) => { const visual = visualFor(category.name); return <button key={category._id} onClick={() => { setActiveCategory(category._id); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="group flex flex-col items-center gap-2 rounded-2xl border border-transparent p-3 text-center transition hover:border-gray-100 hover:bg-white hover:shadow-md"><span className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl text-3xl transition group-hover:scale-105 ${visual.color}`}>{category.image ? <img src={category.image} alt="" className="h-full w-full object-cover" /> : visual.emoji}</span><span className="text-[11px] font-semibold leading-4 text-gray-700">{category.name}</span></button>; })}
          </div> : <p className="rounded-xl bg-white p-5 text-sm text-gray-500">Categories will appear here when the store catalogue is configured.</p>}
        </section>

        {offerProducts.length > 0 && <section className="pb-7 pt-2">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">Picked by our store team</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Today’s best offers <span className="text-xl">✨</span></h2><p className="mt-1 text-sm text-slate-500">Fresh discounts added by our store team, updated from the live catalogue.</p></div>
            <button onClick={() => { setActiveCategory("All"); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-50">Shop all deals →</button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{offerProducts.map((product) => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity || 0} onAdd={addProduct} onChange={updateCart} />)}</div>
        </section>}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-r from-[#e2f2e4] to-[#f1f8ee] p-6 shadow-sm sm:p-7"><div><p className="text-xs font-bold uppercase tracking-wider text-green-800">Fresh every day</p><h3 className="mt-1 text-xl font-extrabold">Fruits & vegetables</h3><p className="mt-1 text-xs text-gray-600">Bring home the goodness</p></div><span className="text-6xl">🥑</span></div>
          <div className="flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-r from-[#fff0d9] to-[#fff8e9] p-6 shadow-sm sm:p-7"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-800">Snack smarter</p><h3 className="mt-1 text-xl font-extrabold">Treats for every mood</h3><p className="mt-1 text-xs text-gray-600">Discover your favourites</p></div><span className="text-6xl">🍪</span></div>
        </section>

        <section id="products" className="py-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Handpicked for your home</p><h2 className="mt-1 text-2xl font-black tracking-tight">{activeCategory === "All" ? "Popular products" : categories.find((category) => category._id === activeCategory)?.name || "Products"}</h2></div>
            <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none"><option value="All">All categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>
          </div>
          {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /></div>
          : loadError ? <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">⚠️</p><h3 className="mt-2 font-bold">Store catalogue is unavailable</h3><p className="mt-1 text-sm text-gray-500">Please check the server connection and try again.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">Retry</button></div>
          : visibleProducts.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity || 0} onAdd={addProduct} onChange={updateCart} />)}</div>
          : <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">🛍️</p><h3 className="mt-2 font-bold">{search ? "No products found" : "Your store is getting ready"}</h3><p className="mt-1 text-sm text-gray-500">{search ? "Try another product or category." : "Products added by your store admin will appear here."}</p></div>}
        </section>
        <section className="mb-8 rounded-2xl bg-white p-5 text-center shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-green-700">Shopping made simple</p><h2 className="mt-2 text-xl font-extrabold">A better way to stock up</h2><p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">Browse essentials, add what you need and review your basket before checkout.</p><Link to="/search" className="mt-4 inline-flex rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800">Explore products</Link></section>
      </div>

      {cartCount > 0 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div><p className="text-sm font-bold">{cartCount} {cartCount === 1 ? "item" : "items"} in your cart</p><p className="text-xs text-gray-500">Subtotal · ₹{cartTotal}</p></div><button onClick={() => navigate("/cart")} className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800">View cart <span className="ml-2">→</span></button></div></div>}
    </div>
  );
}
