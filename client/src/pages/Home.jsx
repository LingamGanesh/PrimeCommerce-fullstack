import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

function readCart() {
  try { return JSON.parse(localStorage.getItem("quick-commerce-cart") || "{}"); }
  catch { return {}; }
}

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
  const [cart, setCart] = useState(readCart);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

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

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = products.reduce((sum, product) => sum + product.price * (cart[product.id] || 0), 0);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const categoryIds = (product.categoryId || []).map((category) => typeof category === "object" ? category?._id : category);
    const matchesCategory = activeCategory === "All" || categoryIds.includes(activeCategory);
    const query = search.toLowerCase().trim();
    return matchesCategory && (!query || product.name.toLowerCase().includes(query) || (product.categoryName || "").toLowerCase().includes(query));
  }), [products, activeCategory, search]);

  const updateCart = (id, delta) => {
    setCart((current) => {
      const next = { ...current, [id]: Math.max(0, (current[id] || 0) + delta) };
      if (!next[id]) delete next[id];
      localStorage.setItem("quick-commerce-cart", JSON.stringify(next));
      return next;
    });
  };
  const addProduct = (product) => { updateCart(product.id, 1); toast.success(`${product.name} added to cart`); };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-900">
      <div className="bg-[#f8cb46]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-8">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-green-800">QUICK COMMERCE · EVERYDAY MADE EASY</span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Your daily essentials,<br className="hidden sm:block" /> at your doorstep.</h1>
            <p className="mt-2 max-w-md text-sm text-gray-700">Groceries, fresh picks and household favourites — all in one convenient place.</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-gray-800"><span className="rounded-full bg-white/70 px-3 py-2">✓ Fresh picks</span><span className="rounded-full bg-white/70 px-3 py-2">✓ Easy ordering</span><span className="rounded-full bg-white/70 px-3 py-2">✓ Secure checkout</span></div>
          </div>
          <div className="w-full max-w-lg rounded-2xl border border-white/60 bg-white p-3 shadow-lg">
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-xl">⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && navigate(`/search?q=${encodeURIComponent(search)}`)} placeholder="Search for atta, milk, fruits..." className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" aria-label="Search products" />
              {search && <button onClick={() => setSearch("")} className="text-xs text-gray-500">Clear</button>}
            </div>
            <p className="px-2 pt-3 text-xs text-gray-500">Search your store's live product catalogue</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="py-7">
          <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Browse by department</p><h2 className="mt-1 text-xl font-extrabold">Shop by category</h2></div><button onClick={() => setActiveCategory("All")} className="text-xs font-bold text-green-800">View all</button></div>
          {categories.length ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {categories.map((category) => { const visual = visualFor(category.name); return <button key={category._id} onClick={() => { setActiveCategory(category._id); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition hover:bg-white hover:shadow-sm"><span className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl text-3xl transition group-hover:scale-105 ${visual.color}`}>{category.image ? <img src={category.image} alt="" className="h-full w-full object-cover" /> : visual.emoji}</span><span className="text-[11px] font-semibold leading-4 text-gray-700">{category.name}</span></button>; })}
          </div> : <p className="rounded-xl bg-white p-5 text-sm text-gray-500">Categories will appear here when the store catalogue is configured.</p>}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between overflow-hidden rounded-2xl bg-[#e7f4e8] p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-green-800">Fresh every day</p><h3 className="mt-1 text-xl font-extrabold">Fruits & vegetables</h3><p className="mt-1 text-xs text-gray-600">Bring home the goodness</p></div><span className="text-6xl">🥑</span></div>
          <div className="flex items-center justify-between overflow-hidden rounded-2xl bg-[#fff0d9] p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-800">Snack smarter</p><h3 className="mt-1 text-xl font-extrabold">Treats for every mood</h3><p className="mt-1 text-xs text-gray-600">Discover your favourites</p></div><span className="text-6xl">🍪</span></div>
        </section>

        <section id="products" className="py-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Handpicked for your home</p><h2 className="mt-1 text-xl font-extrabold">{activeCategory === "All" ? "Popular products" : categories.find((category) => category._id === activeCategory)?.name || "Products"}</h2></div>
            <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none"><option value="All">All categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>
          </div>
          {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /><div className="h-56 animate-pulse rounded-2xl bg-gray-200" /></div>
          : loadError ? <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">⚠️</p><h3 className="mt-2 font-bold">Store catalogue is unavailable</h3><p className="mt-1 text-sm text-gray-500">Please check the server connection and try again.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">Retry</button></div>
          : visibleProducts.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} quantity={cart[product.id] || 0} onAdd={addProduct} onChange={updateCart} />)}</div>
          : <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">🛍️</p><h3 className="mt-2 font-bold">{search ? "No products found" : "Your store is getting ready"}</h3><p className="mt-1 text-sm text-gray-500">{search ? "Try another product or category." : "Products added by your store admin will appear here."}</p></div>}
        </section>
        <section className="mb-8 rounded-2xl bg-white p-5 text-center shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-green-700">Shopping made simple</p><h2 className="mt-2 text-xl font-extrabold">A better way to stock up</h2><p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">Browse essentials, add what you need and review your basket before checkout.</p><Link to="/search" className="mt-4 inline-flex rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800">Explore products</Link></section>
      </div>

      {cartCount > 0 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div><p className="text-sm font-bold">{cartCount} {cartCount === 1 ? "item" : "items"} in your cart</p><p className="text-xs text-gray-500">Subtotal · ₹{cartTotal}</p></div><button onClick={() => navigate("/cart")} className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800">View cart <span className="ml-2">→</span></button></div></div>}
    </div>
  );
}
