import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

const categoryIcon = (name = "") => {
  const value = name.toLowerCase();
  if (/fruit|vegetable|produce/.test(value)) return "🥦";
  if (/dairy|milk|bread|egg/.test(value)) return "🥛";
  if (/snack|chip|munch/.test(value)) return "🍿";
  if (/drink|beverage|juice/.test(value)) return "🥤";
  if (/personal|beauty|care/.test(value)) return "🧴";
  if (/clean|home/.test(value)) return "🧹";
  if (/rice|atta|dal|grain/.test(value)) return "🌾";
  return "🛍️";
};

function SearchProductCard({ product, quantity, onAdd, onQuantity }) {
  const [quickView, setQuickView] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const options = Array.isArray(product.more_details?.packOptions) && product.more_details.packOptions.length
    ? product.more_details.packOptions
    : [{ label: product.unit || "1 pack", price: Number(product.price) || 0 }];
  const [selectedPack, setSelectedPack] = useState(options[1] || options[0]);
  const image = product.image?.[0] || product.images?.[0];
  const open = () => { setSelectedPack(options[1] || options[0]); setQuickView(true); };
  return <>
    <article onClick={open} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") open(); }} role="button" tabIndex={0} className="group cursor-pointer overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,.06)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_22px_45px_rgba(15,23,42,.12)]">
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-[#f1f7ec] to-[#f8f5eb] sm:h-48">{image && !imageFailed ? <img src={image} alt={product.name} onError={() => setImageFailed(true)} loading="lazy" className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" /> : <span className="text-5xl">{categoryIcon(product.categoryName)}</span>}<span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-slate-600">{product.unit || "Pack"}</span></div>
      <div className="p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-emerald-700">{product.categoryName || "Daily essentials"}</p><h2 className="mt-1 min-h-10 text-sm font-extrabold leading-5 text-slate-900">{product.name}</h2><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><div><p className="text-base font-black text-slate-950">From ₹{Math.min(...options.map(option => Number(option.price) || 0))}</p><p className="text-[10px] text-slate-500">{options.length} pack sizes · {quantity || 0} in basket</p></div><button type="button" onClick={event => { event.stopPropagation(); open(); }} className="rounded-xl bg-[#176b3b] px-4 py-2.5 text-[10px] font-extrabold text-white">VIEW OPTIONS</button></div></div>
    </article>
    {quickView && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setQuickView(false)}><section role="dialog" aria-modal="true" onClick={event => event.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-700">Choose your pack</p><h3 className="mt-1 text-lg font-black">{product.name}</h3></div><button onClick={() => setQuickView(false)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl" aria-label="Close">×</button></div>
      <div className="grid grid-cols-[100px_1fr] gap-4 p-5"><div className="grid h-24 place-items-center rounded-2xl bg-[#f5f7f1]">{image && !imageFailed && <img src={image} alt="" onError={() => setImageFailed(true)} className="h-full w-full object-contain p-2" />}</div><p className="text-sm leading-6 text-slate-600">{product.description || "A quality pick for your everyday needs."}</p></div>
      <div className="space-y-2 px-5 pb-4">{options.map(option => <button key={option.label} onClick={() => setSelectedPack(option)} className={"flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left " + (selectedPack.label === option.label ? "border-emerald-700 bg-emerald-50" : "border-slate-200")}><span className="text-sm font-bold">{option.label}</span><span className="font-black">₹{option.price}</span></button>)}</div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-4"><div><p className="text-[10px] font-bold uppercase text-slate-500">Selected price</p><p className="text-2xl font-black">₹{selectedPack.price}</p></div><button onClick={() => { onAdd(product, selectedPack.label); setQuickView(false); }} className="rounded-2xl bg-[#176b3b] px-7 py-3.5 text-sm font-extrabold text-white">Add to basket</button></div>
    </section></div>}
  </>;
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [query, setQuery] = useState(params.get("q") || "");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("relevance");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setQuery(params.get("q") || ""); }, [params]);

  const refreshCart = useCallback(async () => {
    if (!user?._id) { setCart({}); return; }
    try {
      const response = await Axios.get("/api/v1/cart");
      const next = {};
      for (const item of response.data?.data?.items || []) { const id = item.product.id; next[id] = { quantity: (next[id]?.quantity || 0) + item.quantity, cartItemId: item.cartItemId }; }
      setCart(next);
    } catch { setCart({}); }
  }, [user?._id]);

  useEffect(() => {
    let active = true;
    Promise.all([Axios.get("/api/v1/products?limit=100"), Axios.get("/api/v1/categories")])
      .then(([productResponse, categoryResponse]) => {
        if (!active) return;
        const rows = productResponse.data?.data || [];
        setProducts(rows.map((product) => ({
          ...product,
          id: product.id || product._id,
          categoryName: Array.isArray(product.categoryId) ? product.categoryId.map((item) => item?.name).filter(Boolean).join(", ") : "",
        })));
        setCategories(categoryResponse.data?.data || []);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = products.filter((product) => {
      const categoryIds = (product.categoryId || []).map((item) => typeof item === "object" ? item?._id : item);
      const matchesCategory = category === "All" || categoryIds.includes(category);
      const matchesTerm = !term || [product.name, product.categoryName, product.description, product.brand].filter(Boolean).join(" ").toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
    if (sort === "price-low") rows.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-high") rows.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [products, query, category, sort]);

  const add = async (product, variantLabel) => {
    if (!user?._id) { toast.error("Please login to add products"); navigate("/login"); return; }
    if (busy) return;
    setBusy(true);
    try { await Axios.post("/api/v1/cart/items", { productId: product.id, quantity: 1, variantLabel }); await refreshCart(); toast.success("Added to cart"); }
    catch (err) { toast.error(err.response?.data?.message || "Unable to add product"); }
    finally { setBusy(false); }
  };

  const changeQuantity = async (id, delta) => {
    const item = cart[id];
    if (!item || busy) return;
    setBusy(true);
    try {
      const quantity = item.quantity + delta;
      if (quantity <= 0) await Axios.delete("/api/v1/cart/items/" + item.cartItemId);
      else await Axios.patch("/api/v1/cart/items/" + item.cartItemId, { quantity });
      await refreshCart();
    } catch (err) { toast.error(err.response?.data?.message || "Unable to update cart"); }
    finally { setBusy(false); }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setParams(query.trim() ? { q: query.trim() } : {});
  };
  const count = Object.values(cart).reduce((total, item) => total + item.quantity, 0);

  return (
    <main className="min-h-[70vh] bg-[#fafaf7] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link to="/" className="text-xs font-bold text-green-700 hover:underline">← Back to home</Link>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-green-700">Find your everyday favourites</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Search products</h1>
        </div>

        <form onSubmit={submitSearch} className="flex gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-green-600">
          <span className="flex items-center pl-2 text-xl text-gray-400">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for milk, fruits, snacks..." aria-label="Search products" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" />
          {query && <button type="button" onClick={() => { setQuery(""); setParams({}); }} className="px-2 text-xs font-semibold text-gray-500">Clear</button>}
          <button className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800">Search</button>
        </form>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="font-extrabold">Categories</h2>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              <button onClick={() => setCategory("All")} className={"shrink-0 rounded-xl px-3 py-2.5 text-left text-sm font-semibold " + (category === "All" ? "bg-green-50 text-green-800" : "text-gray-600 hover:bg-gray-50")}>🛍️ <span className="ml-2">All products</span></button>
              {categories.map((item) => <button key={item._id} onClick={() => setCategory(item._id)} className={"flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold " + (category === item._id ? "bg-green-50 text-green-800" : "text-gray-600 hover:bg-gray-50")}><span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-50">{item.image ? <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : categoryIcon(item.name)}</span><span>{item.name}</span></button>)}
            </div>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-extrabold">{query ? 'Results for "' + query + '"' : "All products"}</h2><p className="mt-1 text-xs text-gray-500">{loading ? "Loading catalogue…" : visible.length + " products found"}</p></div>
              <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products" className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 outline-none"><option value="relevance">Sort: Recommended</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name">Name: A to Z</option></select>
            </div>
            {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{Array.from({length:8}, (_,i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />)}</div>
            : error ? <div className="rounded-2xl bg-white p-10 text-center"><p className="text-3xl">⚠️</p><h3 className="mt-2 font-bold">Could not load products</h3><p className="mt-1 text-sm text-gray-500">Check your connection and try again.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">Retry</button></div>
            : visible.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{visible.map((product) => <SearchProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity || 0} onAdd={add} onQuantity={changeQuantity} />)}</div>
            : <div className="rounded-2xl bg-white p-10 text-center"><span className="text-4xl">🔎</span><h3 className="mt-3 font-bold">No matching products</h3><p className="mt-1 text-sm text-gray-500">Try a different search or choose another category.</p><button onClick={() => {setQuery("");setCategory("All");setParams({});}} className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">Clear filters</button></div>}
          </section>
        </div>
      </div>
      {count > 0 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div><p className="text-sm font-bold">{count} {count === 1 ? "item" : "items"} in cart</p><p className="text-xs text-gray-500">Your basket is ready</p></div><button onClick={() => navigate("/cart")} className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white">View cart →</button></div></div>}
    </main>
  );
}
