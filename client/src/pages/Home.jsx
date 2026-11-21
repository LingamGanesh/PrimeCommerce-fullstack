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

const categoryImageFor = (category) => {
  if (category?.image) return category.image;
  const name = String(category?.name || "").toLowerCase();
  const matches = [
    [/fruit|vegetable|produce/, "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80"],
    [/dairy|milk|egg|cheese/, "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=700&q=80"],
    [/bakery|bread/, "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80"],
    [/snack|drink|beverage/, "https://images.unsplash.com/photo-1621939514649-280e2aa1f1ba?auto=format&fit=crop&w=700&q=80"],
    [/atta|rice|staple|grain|dal/, "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80"],
    [/personal|beauty|care/, "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80"],
    [/home|clean|laundry/, "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=80"],
  ];
  return matches.find(([pattern]) => pattern.test(name))?.[1] || "";
};

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
          {products.map((product) => <div key={product.id} className="w-[220px] min-w-[220px] snap-start sm:w-[245px] sm:min-w-[245px]"><ProductCard product={product} cartEntry={cart[product.id]} onAdd={onAdd} onChange={onChange} /></div>)}
        </div>
      </> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-5 py-8 text-center"><span className="text-3xl">🌱</span><h3 className="mt-2 text-sm font-extrabold text-slate-800">{emptyTitle}</h3><p className="mt-1 text-xs text-slate-500">{emptyText}</p></div>}
    </div>
  );
}

function readCart() { return {}; }

function getProductVariants(product) {
  const configured = product.more_details?.packOptions;
  if (Array.isArray(configured) && configured.length) return configured.filter((v) => v?.label && Number.isFinite(Number(v.price))).map((v) => ({ label: v.label, price: Number(v.price) }));
  const unit = String(product.unit || "").trim();
  const match = unit.match(/^([\d.]+)\s*(kg|g|l|ml)$/i);
  if (!match) return [{ label: unit || "1 item", price: Number(product.price || 0) }];
  const amount = Number(match[1]);
  const measure = match[2].toLowerCase();
  const base = measure === "kg" ? amount * 1000 : measure === "l" ? amount * 1000 : amount;
  const family = measure === "kg" || measure === "g" ? "g" : "ml";
  const choices = family === "g" ? [250, 500, 1000] : [1, 10, 100, 250, 500, 1000];
  const labels = family === "g" ? ["250 g", "500 g", "1 kg"] : ["1 ml", "10 ml", "100 ml", "250 ml", "500 ml", "1 L"];
  const variants = choices.map((amountValue, index) => ({ label: labels[index], price: Math.max(1, Math.round((Number(product.price || 0) * amountValue / base) * 100) / 100) }));
  if (!variants.some((v) => v.label.toLowerCase() === unit.toLowerCase())) variants.push({ label: unit, price: Number(product.price || 0) });
  return variants.sort((a, b) => {
    const parse = (label) => { const m = label.match(/^([\d.]+)\s*(kg|g|l|ml)$/i); return m ? Number(m[1]) * (/^(kg|l)$/i.test(m[2]) ? 1000 : 1) : 0; };
    return parse(a.label) - parse(b.label);
  });
}

function ProductCard({ product, cartEntry, onAdd, onChange }) {
  const [imageFailed, setImageFailed] = useState(false);
  const variants = useMemo(() => getProductVariants(product), [product]);
  const [selectedLabel, setSelectedLabel] = useState(variants[0]?.label || product.unit || "1 item");
  const selectedVariant = variants.find((v) => v.label === selectedLabel) || variants[0];
  const selectedCart = cartEntry?.variants?.[selectedVariant?.label] || {};
  const quantity = selectedCart.quantity || 0;
  const visual = visualFor(product.name + " " + (product.categoryName || ""));
  const image = product.images?.[0] || product.image?.[0];
  const discount = Number(product.discountPercent || 0);
  const price = Number(selectedVariant?.price ?? product.price ?? 0);
  const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : null;

  return (
    <article className="group min-w-0 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_10px_34px_rgba(15,23,42,.06)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_24px_52px_rgba(15,23,42,.13)]">
      <div className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${visual.color} sm:h-48`}>
        {discount > 0 && <span className="absolute left-3 top-3 z-10 rounded-full bg-[#176b3b] px-3 py-1.5 text-[9px] font-extrabold tracking-wide text-white">{discount}% OFF</span>}
        {image && !imageFailed
          ? <img src={image} alt={product.name} onError={() => setImageFailed(true)} className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          : <span className="text-6xl" aria-label={product.name}>{visual.emoji}</span>}
        <span className="absolute bottom-3 right-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[9px] font-bold text-slate-600">{selectedVariant?.label || product.unit || "1 item"}</span>
      </div>
      <div className="p-4">
        <p className="mb-1.5 line-clamp-1 text-[9px] font-extrabold uppercase tracking-[.16em] text-emerald-700">{product.categoryName || "Daily essentials"}</p>
        <h3 className="min-h-10 text-[13px] font-extrabold leading-5 text-slate-900 sm:text-sm">{product.name}</h3>
        <p className="mt-1 min-h-9 line-clamp-2 text-[11px] leading-4 text-slate-500">{product.description || "A carefully selected everyday essential."}</p>
        <div className="mt-3 border-t border-slate-100 pt-3">
          {variants.length > 1 && <label className="mb-3 block"><span className="mb-1 block text-[10px] font-bold text-slate-600">Choose size / weight</span><select value={selectedLabel} onChange={(event) => setSelectedLabel(event.target.value)} className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 outline-none focus:border-emerald-500">{variants.map((variant) => <option key={variant.label} value={variant.label}>{variant.label} · ₹{variant.price}</option>)}</select></label>}
          <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2"><p className="text-base font-black text-slate-950">₹{price}</p>{originalPrice && <p className="text-[10px] text-slate-400 line-through">₹{originalPrice}</p>}</div>
            <p className="text-[10px] text-slate-500">{quantity || 0} in basket</p>
          </div>
          {quantity > 0
            ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-1"><button type="button" onClick={() => onChange(product.id, selectedVariant.label, -1)} aria-label={`Remove one ${product.name}`} className="grid h-8 w-8 place-items-center rounded-lg bg-white font-bold text-emerald-800">−</button><span className="min-w-5 text-center text-sm font-black text-emerald-900">{quantity}</span><button type="button" onClick={() => onChange(product.id, selectedVariant.label, 1)} aria-label={`Add one more ${product.name}`} className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 font-bold text-white">+</button></div>
            : <button type="button" onClick={() => onAdd(product, selectedVariant.label)} className="rounded-xl bg-[#176b3b] px-5 py-2.5 text-[11px] font-extrabold tracking-wide text-white shadow-sm transition hover:bg-[#0f4e2a]">ADD +</button>}
        </div>
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
        const productResponse = await Axios.get("/api/v1/products?limit=100");
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
      for (const item of response.data?.data?.items || []) {
        const id = item.product.id;
        const label = item.product.variantLabel || item.product.unit || "1 item";
        if (!next[id]) next[id] = { quantity: 0, variants: {} };
        next[id].quantity += item.quantity;
        next[id].variants[label] = { quantity: item.quantity, cartItemId: item.cartItemId, unitPrice: item.product.price, lineTotal: item.lineTotal };
      }
      setCart(next);
    } catch { setCart({}); }
  }, [user?._id]);
  useEffect(() => { refreshCart(); }, [refreshCart]);
  const cartCount = Object.values(cart).reduce((sum, entry) => sum + entry.quantity, 0);
  const cartTotal = Object.values(cart).reduce((sum, entry) => sum + Object.values(entry.variants || {}).reduce((part, variant) => part + Number(variant.lineTotal || 0), 0), 0);
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

  const updateCart = async (id, variantLabel, delta) => {
    if (!user?._id) { toast.error("Please login to add products"); navigate("/login"); return; }
    const entry = cart[id]?.variants?.[variantLabel];
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
  const addProduct = async (product, variantLabel) => {
    if (!user?._id) { toast.error("Please login to add products"); navigate("/login"); return; }
    if (cartBusy) return;
    setCartBusy(true);
    try {
      await Axios.post("/api/v1/cart/items", { productId: product.id, quantity: 1, variantLabel });
      await refreshCart();
      toast.success(product.name + " added to cart");
    } catch (error) { toast.error(error.response?.data?.message || "Unable to add product"); }
    finally { setCartBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-900">
      <section className="relative isolate mx-auto mt-5 max-w-[1400px] overflow-hidden rounded-[30px] bg-[#102b20] text-white shadow-[0_24px_65px_rgba(16,43,32,.18)] sm:mt-7 sm:rounded-[38px]">
        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=85" alt="Fresh colourful vegetables and produce at a market" className="absolute inset-0 h-full w-full object-cover object-center opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#102b20] via-[#102b20]/95 to-[#102b20]/35" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-lime-300/20 blur-3xl" />
        <div className="relative grid min-h-[390px] items-center gap-8 px-6 py-12 sm:px-10 sm:py-16 lg:min-h-[465px] lg:grid-cols-[1.15fr_.85fr] lg:px-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-200/25 bg-white/10 px-4 py-2 text-[9px] font-extrabold uppercase tracking-[.24em] text-lime-200 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> THE PRIME EVERYDAY EDITION</span>
            <h1 className="mt-6 text-[42px] font-black leading-[1.02] tracking-[-.045em] sm:text-6xl lg:text-[68px]">Good food.<br /><span className="text-lime-300">Better days.</span></h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-emerald-50/80 sm:text-base">Discover fresh groceries, everyday essentials and little things that make home feel special — all in one easy place.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-lime-300 px-7 py-3.5 text-xs font-black text-[#102b20] shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-lime-200">Explore the store <span className="ml-2">↗</span></button>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-3 text-[10px] font-bold text-white/85 backdrop-blur">Fresh picks · Daily essentials</span>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/15 pt-5 text-[10px] font-semibold tracking-wide text-emerald-50/80"><span>✦ Carefully selected essentials</span><span>✦ Simple, secure checkout</span>{user?.name && <span>Welcome back, {user.name.split(" ")[0]}</span>}</div>
          </div>
          <div className="relative hidden min-h-[310px] items-center justify-center lg:flex">
            <div className="absolute right-5 top-2 h-[290px] w-[290px] rounded-full border border-white/20 bg-white/10 backdrop-blur-sm" />
            <div className="absolute right-12 top-9 h-[230px] w-[230px] rounded-full border border-lime-100/20" />
            <img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85" alt="Fresh salad ingredients" className="relative z-10 h-[285px] w-[285px] rounded-full border-[10px] border-white/15 object-cover shadow-2xl" />
            <div className="absolute bottom-5 left-0 z-20 rounded-2xl border border-white/20 bg-white/95 px-4 py-3 text-[#183725] shadow-xl backdrop-blur"><p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-emerald-700">A fresher routine</p><p className="mt-1 text-sm font-black">Made for everyday</p></div>
            <div className="absolute right-0 top-8 z-20 rounded-full bg-lime-300 px-4 py-2 text-[10px] font-black text-[#173523] shadow-lg">FRESH • SIMPLE • PRIME</div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <section id="categories" className="scroll-mt-36 py-9 sm:py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-emerald-700">Explore the good stuff</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Shop by category <span>✳</span></h2><p className="mt-1 text-sm text-slate-500">Your everyday favourites, thoughtfully brought together.</p></div>
            <button type="button" onClick={() => { setActiveCategory("All"); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-full border border-[#e5e9df] bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#315b3f] shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50">View all products ↗</button>
          </div>
          {categories.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {categories.map((category, index) => {
              const visual = visualFor(category.name);
              const tones = ["from-[#edf7eb] to-[#f8fbf4]", "from-[#eff5fb] to-[#f8fbff]", "from-[#fff3e8] to-[#fffaf4]", "from-[#f1f0fb] to-[#faf9ff]", "from-[#fff5e8] to-[#fffdf7]", "from-[#fceef1] to-[#fff9fa]"];
              return <button key={category._id} type="button" onClick={() => { setActiveCategory(category._id); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="group relative overflow-hidden rounded-[22px] border border-[#edf0e8] bg-white p-3 text-left shadow-[0_6px_22px_rgba(25,50,30,.045)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_16px_35px_rgba(25,70,40,.11)] sm:rounded-[26px] sm:p-4">
                <div className={`relative mb-3 grid aspect-[1.25/1] place-items-center overflow-hidden rounded-[17px] bg-gradient-to-br ${tones[index % tones.length]}`}>
                  <span className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/60 blur-xl" />
                  {categoryImageFor(category) ? <img src={categoryImageFor(category)} alt={category.name} loading="lazy" className="relative h-full w-full object-cover transition duration-500 group-hover:scale-110" /> : <span className="relative text-5xl transition duration-500 group-hover:scale-110" aria-hidden="true">{visual.emoji}</span>}
                </div>
                <div className="flex items-center justify-between gap-1"><span className="line-clamp-1 text-[11px] font-extrabold text-slate-800 sm:text-xs">{category.name}</span><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#edf5ec] text-[11px] font-black text-[#28613d] transition group-hover:bg-[#176b3b] group-hover:text-white">↗</span></div>
              </button>;
            })}
          </div> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-7 text-center text-sm text-slate-500">Categories added by your store admin will appear here.</div>}
        </section>

        <section id="fresh-arrivals" className="scroll-mt-36 py-8 sm:py-10">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">Just landed in store</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Fresh arrivals <span>🌿</span></h2><p className="mt-1 text-sm text-slate-500">The latest products added by our store team.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-800">NEW IN</span></div>
          {loading ? <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> : <ProductCarousel id="fresh-arrivals-carousel" products={freshArrivals} cart={cart} onAdd={addProduct} onChange={updateCart} emptyTitle="Fresh picks are on the way" emptyText="New products added by the admin will appear here." />}
        </section>

        <section id="live-offers" className="scroll-mt-36 relative isolate mb-7 overflow-hidden rounded-[30px] bg-[#102b20] px-4 py-7 text-white shadow-[0_22px_55px_rgba(16,43,32,.16)] sm:px-7 sm:py-9">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">{recommendedProducts.map((product) => <ProductCard key={product.id} product={product} cartEntry={cart[product.id]} onAdd={addProduct} onChange={updateCart} />)}</div>
        </section>}

        <section id="products" className="py-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Handpicked for your home</p><h2 className="mt-1 text-2xl font-black tracking-tight">{activeCategory === "All" ? "Popular products" : categories.find((category) => category._id === activeCategory)?.name || "Products"}</h2></div>
            <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none"><option value="All">All categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>
          </div>
          {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /></div>
          : loadError ? <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">⚠️</p><h3 className="mt-2 font-bold">Store catalogue is unavailable</h3><p className="mt-1 text-sm text-gray-500">Please check the server connection and try again.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">Retry</button></div>
          : visibleProducts.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} cartEntry={cart[product.id]} onAdd={addProduct} onChange={updateCart} />)}</div>
          : <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">🛍️</p><h3 className="mt-2 font-bold">Your store is getting ready</h3><p className="mt-1 text-sm text-gray-500">Products added by your store admin will appear here.</p></div>}
        </section>

      </div>

      {cartCount > 0 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div><p className="text-sm font-bold">{cartCount} {cartCount === 1 ? "item" : "items"} in your cart</p><p className="text-xs text-gray-500">Subtotal · ₹{cartTotal}</p></div><button onClick={() => navigate("/cart")} className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800">View cart <span className="ml-2">→</span></button></div></div>}
    </div>
  );
}
