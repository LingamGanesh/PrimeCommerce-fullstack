import { useEffect, useState } from "react";
import Axios from "../utils/Axios";
import toast from "react-hot-toast";

const blankProduct = { name: "", unit: "1 pack", price: "", discount: "0", stock: "0", description: "", image: "", categoryId: "", sub_categoryId: "", publish: true };
const idOf = (value) => typeof value === "object" && value ? value._id : value;
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

export default function AdminCatalog({ products = [], onRefresh }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [productForm, setProductForm] = useState(blankProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [subName, setSubName] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const filteredProducts = products.filter((product) => `${product.name || ""} ${product.unit || ""}`.toLowerCase().includes(catalogSearch.trim().toLowerCase()));

  const loadTaxonomy = async () => {
    try {
      const [categoryResponse, subResponse] = await Promise.all([Axios.get("/api/v1/categories"), Axios.get("/api/v1/subcategories")]);
      setCategories(categoryResponse.data?.data || []);
      setSubcategories(subResponse.data?.data || []);
    } catch { toast.error("Could not load categories"); }
  };
  useEffect(() => { loadTaxonomy(); }, []);

  const submitProduct = async (event) => {
    event.preventDefault();
    if (!productForm.categoryId || !productForm.sub_categoryId) return toast.error("Choose a category and subcategory");
    const payload = { name: productForm.name.trim(), unit: productForm.unit.trim(), price: Number(productForm.price), discount: Number(productForm.discount), stock: Number(productForm.stock), description: productForm.description, image: productForm.image.trim() ? [productForm.image.trim()] : [], categoryId: [productForm.categoryId], sub_categoryId: [productForm.sub_categoryId], publish: productForm.publish };
    if (!payload.name || !payload.unit || !Number.isFinite(payload.price) || payload.price < 0 || !Number.isFinite(payload.discount) || payload.discount < 0 || payload.discount > 100 || !Number.isInteger(payload.stock) || payload.stock < 0) return toast.error("Check product name, price, discount and stock values");
    setSaving(true);
    try {
      if (editingProduct) await Axios.patch(`/api/v1/admin/products/${editingProduct}`, payload);
      else await Axios.post("/api/v1/admin/products", payload);
      toast.success(editingProduct ? "Product updated" : "Product created");
      setProductForm(blankProduct); setEditingProduct(null); await onRefresh?.();
    } catch (error) { toast.error(error.response?.data?.message || "Could not save product"); }
    finally { setSaving(false); }
  };

  const startEditProduct = (product) => {
    setEditingProduct(product._id);
    setProductForm({ name: product.name || "", unit: product.unit || "", price: String(product.price ?? ""), discount: String(product.discount ?? 0), stock: String(product.stock ?? 0), description: product.description || "", image: product.image?.[0] || "", categoryId: idOf(product.categoryId?.[0]) || "", sub_categoryId: idOf(product.sub_categoryId?.[0]) || "", publish: product.publish !== false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCategory = async (event) => {
    event.preventDefault(); if (!categoryName.trim()) return toast.error("Enter category name");
    setSaving(true);
    try {
      if (editingCategory) await Axios.patch(`/api/v1/admin/categories/${editingCategory}`, { name: categoryName.trim(), image: categoryImage });
      else await Axios.post("/api/v1/admin/categories", { name: categoryName.trim(), image: categoryImage });
      toast.success(editingCategory ? "Category updated" : "Category added"); setCategoryName(""); setCategoryImage(""); setEditingCategory(null); await loadTaxonomy();
    } catch (error) { toast.error(error.response?.data?.message || "Could not save category"); }
    finally { setSaving(false); }
  };

  const saveSubcategory = async (event) => {
    event.preventDefault(); if (!subName.trim() || !subCategoryId) return toast.error("Enter a name and choose a parent category");
    setSaving(true);
    try { await Axios.post("/api/v1/admin/subcategories", { name: subName.trim(), categoryId: [subCategoryId] }); toast.success("Subcategory added"); setSubName(""); await loadTaxonomy(); }
    catch (error) { toast.error(error.response?.data?.message || "Could not add subcategory"); }
    finally { setSaving(false); }
  };

  const archive = async (product) => {
    if (!window.confirm(`Unpublish ${product.name}? It will no longer appear in the customer catalogue.`)) return;
    try { await Axios.delete(`/api/v1/admin/products/${product._id}`); toast.success("Product unpublished"); await onRefresh?.(); }
    catch (error) { toast.error(error.response?.data?.message || "Could not unpublish product"); }
  };

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-extrabold text-slate-900">{editingProduct ? "Edit product" : "Add a product"}</h2><p className="text-sm text-slate-500">Create and maintain the customer-facing catalogue.</p></div>{editingProduct && <button onClick={() => { setEditingProduct(null); setProductForm(blankProduct); }} className="text-sm font-semibold text-slate-500">Cancel edit</button>}</div>
      <form onSubmit={submitProduct} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-semibold text-slate-600">Product name<input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-500" placeholder="e.g. Fresh bananas" /></label>
        <label className="text-sm font-semibold text-slate-600">Unit / pack size<input required value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-500" placeholder="e.g. 500 g" /></label>
        <label className="text-sm font-semibold text-slate-600">Selling price (₹)<input required type="number" min="0" step="0.01" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-500" /></label>
        <label className="text-sm font-semibold text-slate-600">Discount (%)<input type="number" min="0" max="100" value={productForm.discount} onChange={e => setProductForm({ ...productForm, discount: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-500" /></label>
        <label className="text-sm font-semibold text-slate-600">Available stock<input required type="number" min="0" step="1" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-500" /></label>
        <label className="text-sm font-semibold text-slate-600">Category<select required value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value, sub_categoryId: "" })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"><option value="">Choose category</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-600">Subcategory<select required value={productForm.sub_categoryId} onChange={e => setProductForm({ ...productForm, sub_categoryId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"><option value="">Choose subcategory</option>{subcategories.filter(s => (s.categoryId || []).some(id => String(idOf(id)) === productForm.categoryId)).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-600">Image URL<input value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-500" placeholder="https://…" /></label>
        <label className="text-sm font-semibold text-slate-600">Description<input value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-500" placeholder="Short product details" /></label>
        <div className="flex items-center gap-2 self-end pb-2"><input id="publish-product" type="checkbox" checked={productForm.publish} onChange={e => setProductForm({ ...productForm, publish: e.target.checked })} /><label htmlFor="publish-product" className="text-sm font-semibold text-slate-600">Publish in store</label></div>
        <div className="md:col-span-2 xl:col-span-3"><button disabled={saving} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : editingProduct ? "Save product changes" : "Create product"}</button></div>
      </form>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900">Catalogue products</h2><p className="text-sm text-slate-500">Edit product details or unpublish an item from the customer store.</p></div><div className="w-full sm:w-72"><label htmlFor="catalog-product-search" className="sr-only">Search catalogue products</label><input id="catalog-product-search" type="search" value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Search product or pack size…" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" /></div></div><div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">Total products</p><p className="mt-1 text-xl font-black text-slate-900">{products.length}</p></div><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-medium text-emerald-700">Published</p><p className="mt-1 text-xl font-black text-emerald-800">{products.filter(p => p.publish).length}</p></div><div className="col-span-2 rounded-xl bg-amber-50 p-3 sm:col-span-1"><p className="text-xs font-medium text-amber-700">Categories</p><p className="mt-1 text-xl font-black text-amber-800">{categories.length}</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400"><th className="pb-3">Product</th><th className="pb-3">Price</th><th className="pb-3">Stock</th><th className="pb-3">Status</th><th className="pb-3">Actions</th></tr></thead><tbody>{filteredProducts.map(p => <tr key={p._id} className="border-b border-slate-50"><td className="py-3"><div className="flex items-center gap-3">{p.image?.[0] ? <img src={p.image[0]} alt="" loading="lazy" className="h-11 w-11 rounded-lg border border-slate-100 bg-slate-50 object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-lg bg-lime-50 text-lg text-lime-700">▧</div>}<div className="min-w-0"><p className="font-bold text-slate-800">{p.name}</p><p className="text-xs text-slate-400">{p.unit}</p></div></div></td><td className="py-3">{money(p.price)}</td><td className="py-3">{p.stock ?? 0}</td><td className="py-3">{p.publish ? "Published" : "Hidden"}</td><td className="py-3"><div className="flex gap-2"><button onClick={() => startEditProduct(p)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold">Edit</button>{p.publish && <button onClick={() => archive(p)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700">Unpublish</button>}</div></td></tr>)}</tbody></table>{!filteredProducts.length && <p className="py-8 text-center text-sm text-slate-400">{catalogSearch ? "No products match your search." : "No products in catalogue."}</p>}</div></section>
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-extrabold text-slate-900">Categories</h2><form onSubmit={saveCategory} className="mt-4 grid gap-3"><input required value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Category name" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={categoryImage} onChange={e => setCategoryImage(e.target.value)} placeholder="Category image URL (optional)" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><button disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">{editingCategory ? "Update category" : "Add category"}</button></form><div className="mt-4 space-y-2">{categories.map(c => <div key={c._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"><span className="text-sm font-semibold">{c.name}</span><button onClick={() => { setEditingCategory(c._id); setCategoryName(c.name); setCategoryImage(c.image || ""); }} className="text-xs font-bold text-emerald-700">Edit</button></div>)}</div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-extrabold text-slate-900">Subcategories</h2><form onSubmit={saveSubcategory} className="mt-4 grid gap-3"><input required value={subName} onChange={e => setSubName(e.target.value)} placeholder="Subcategory name" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><select required value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Parent category</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select><button disabled={saving} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Add subcategory</button></form><div className="mt-4 space-y-2">{subcategories.map(s => <div key={s._id} className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-sm font-semibold">{s.name}</p><p className="text-xs text-slate-400">{(s.categoryId || []).map(id => categories.find(c => c._id === String(idOf(id)))?.name).filter(Boolean).join(", ")}</p></div>)}</div></div>
    </section>
  </div>;
}