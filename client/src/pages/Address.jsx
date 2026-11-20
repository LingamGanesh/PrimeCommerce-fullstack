import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

const emptyAddress = { address_line: "", city: "", state: "", pincode: "", country: "India", mobile: "" };

export default function Address() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadAddresses = async () => {
    try {
      const response = await Axios.get("/api/v1/addresses");
      setAddresses(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load saved addresses");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAddresses(); }, []);

  const saveAddress = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await Axios.post("/api/v1/addresses", { ...form, mobile: String(form.mobile) });
      setAddresses(current => [response.data.data, ...current]);
      setForm(emptyAddress);
      setShowForm(false);
      toast.success("Delivery address saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save address");
    } finally { setSaving(false); }
  };

  const deleteAddress = async (id) => {
    setDeletingId(id);
    try {
      await Axios.delete("/api/v1/addresses/" + id);
      setAddresses(current => current.filter(address => address._id !== id));
      toast.success("Address removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove address");
    } finally { setDeletingId(""); }
  };

  return (
    <main className="min-h-[70vh] bg-[#f7f8f3] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/dashboard/profile" className="text-sm font-bold text-slate-600 hover:text-green-700">← Back to profile</Link>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#123d2a] p-6 text-white shadow-lg sm:p-8">
          <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-lime-300">Your account</p><h1 className="mt-2 text-3xl font-black">Saved addresses</h1><p className="mt-2 text-sm text-green-100">Manage the places where your essentials get delivered.</p></div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3"><p className="text-xs text-green-100">Saved places</p><p className="text-2xl font-black">{addresses.length}</p></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black text-slate-900">Delivery locations</h2><button type="button" onClick={() => setShowForm(value => !value)} className="rounded-xl bg-green-800 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-green-900">{showForm ? "Cancel" : "+ Add new address"}</button></div>
        {showForm && <form onSubmit={saveAddress} className="mt-4 grid gap-3 rounded-3xl border border-green-100 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2"><h3 className="font-black text-slate-900">New delivery address</h3><p className="mt-1 text-xs text-slate-500">Enter complete details so your order reaches the right place.</p></div>
          <input required maxLength="250" placeholder="House / flat, street, area" value={form.address_line} onChange={e => setForm({...form,address_line:e.target.value})} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 sm:col-span-2" />
          <input required placeholder="City" value={form.city} onChange={e => setForm({...form,city:e.target.value})} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-green-600" />
          <input required placeholder="State" value={form.state} onChange={e => setForm({...form,state:e.target.value})} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-green-600" />
          <input required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength="6" placeholder="6-digit pincode" value={form.pincode} onChange={e => setForm({...form,pincode:e.target.value.replace(/\D/g, "").slice(0,6)})} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-green-600" />
          <input required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength="10" placeholder="10-digit mobile number" value={form.mobile} onChange={e => setForm({...form,mobile:e.target.value.replace(/\D/g, "").slice(0,10)})} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-green-600" />
          <button disabled={saving} className="rounded-xl bg-green-800 p-3 text-sm font-extrabold text-white hover:bg-green-900 disabled:opacity-60 sm:col-span-2">{saving ? "Saving…" : "Save address"}</button>
        </form>}
        {loading ? <div className="mt-5 rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Loading saved addresses…</div> : addresses.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">
          {addresses.map((address, index) => <article key={address._id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-xl">📍</span><div><p className="font-extrabold text-slate-900">{address.address_line}</p><p className="text-xs text-slate-500">{index === 0 ? "Recently added" : "Saved address"}</p></div></div><button type="button" disabled={deletingId === address._id} onClick={() => deleteAddress(address._id)} className="rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50">{deletingId === address._id ? "Removing…" : "Remove"}</button></div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{address.city}, {address.state} - {address.pincode}<br />{address.country || "India"}<br /><span className="font-semibold text-slate-800">Mobile: {address.mobile}</span></p>
          </article>)}
        </div> : !showForm && <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><span className="text-4xl">🏠</span><h3 className="mt-3 font-black text-slate-900">No addresses saved</h3><p className="mt-1 text-sm text-slate-500">Add your home or work address for a faster checkout.</p><button type="button" onClick={() => setShowForm(true)} className="mt-4 rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white">Add your first address</button></div>}
      </div>
    </main>
  );
}