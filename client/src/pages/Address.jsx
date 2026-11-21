import { useEffect, useState } from "react";
import { FiMapPin, FiPlus, FiTrash2, FiCrosshair } from "react-icons/fi";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

const emptyAddress = { address_line: "", city: "", state: "", pincode: "", country: "India", mobile: "" };

export default function Address() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const loadAddresses = async () => {
    try {
      const response = await Axios.get("/api/v1/addresses");
      setAddresses(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load saved addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAddresses(); }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const query = new URLSearchParams({ format: "jsonv2", lat: String(coords.latitude), lon: String(coords.longitude) });
        const response = await fetch("https://nominatim.openstreetmap.org/reverse?" + query.toString());
        if (!response.ok) throw new Error("Unable to look up this location");
        const result = await response.json();
        const address = result.address || {};
        const line = [result.name, address.road, address.suburb, address.neighbourhood].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(", ");
        setForm(current => ({
          ...current,
          address_line: line || result.display_name || current.address_line,
          city: address.city || address.town || address.village || address.county || current.city,
          state: address.state || current.state,
          pincode: address.postcode || current.pincode,
          country: address.country || current.country
        }));
        setShowForm(true);
        toast.success("Location detected. Confirm your address and mobile number.");
      } catch (error) {
        toast.error(error.message || "Could not detect your address. Enter it manually.");
      } finally {
        setLocating(false);
      }
    }, error => {
      setLocating(false);
      toast.error(error.code === 1 ? "Allow location access or enter your address manually." : "Location could not be detected. Please try again.");
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  };

  const saveAddress = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      await Axios.post("/api/v1/addresses", { ...form, mobile: String(form.mobile) });
      toast.success("Delivery address saved");
      setForm(emptyAddress);
      setShowForm(false);
      await loadAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save address");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async id => {
    try {
      await Axios.delete("/api/v1/addresses/" + id);
      setAddresses(current => current.filter(address => address._id !== id));
      toast.success("Address removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete address");
    }
  };

  const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";

  return <section className="mx-auto max-w-4xl p-2 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-lime-700">Your delivery details</p><h1 className="mt-2 text-2xl font-black text-slate-900">Saved addresses</h1><p className="mt-1 text-sm text-slate-500">Manage where you want your orders delivered.</p></div>
      <button type="button" onClick={() => setShowForm(value => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#c9f24a] px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-lime-300"><FiPlus/>{showForm ? "Close form" : "Add address"}</button>
    </div>

    {showForm && <form onSubmit={saveAddress} className="mt-6 rounded-2xl border border-slate-200 bg-[#fbfcf8] p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2"><FiMapPin className="text-xl text-lime-700"/><h2 className="font-extrabold text-slate-900">New delivery address</h2></div>
      <button type="button" onClick={useCurrentLocation} disabled={locating} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-lime-300 bg-lime-50 px-4 py-3 text-sm font-bold text-lime-900 hover:bg-lime-100 disabled:opacity-60"><FiCrosshair/>{locating ? "Detecting your location…" : "Use my current location"}</button>
      <p className="mb-4 text-xs leading-5 text-slate-500">Your browser will ask permission to access your location. We use it to prefill the address; please review the details before saving.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-600 sm:col-span-2">House, street and area<input required value={form.address_line} onChange={e=>setForm({...form,address_line:e.target.value})} placeholder="Flat / house no., street, landmark" className={fieldClass+" mt-2"}/></label>
        <label className="text-xs font-bold text-slate-600">City<input required value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="City" className={fieldClass+" mt-2"}/></label>
        <label className="text-xs font-bold text-slate-600">State<input required value={form.state} onChange={e=>setForm({...form,state:e.target.value})} placeholder="State" className={fieldClass+" mt-2"}/></label>
        <label className="text-xs font-bold text-slate-600">PIN code<input required maxLength={6} value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value.replace(/\\D/g,"")})} placeholder="6-digit PIN code" className={fieldClass+" mt-2"}/></label>
        <label className="text-xs font-bold text-slate-600">Mobile number<input required maxLength={10} value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value.replace(/\\D/g,"")})} placeholder="10-digit mobile number" className={fieldClass+" mt-2"}/></label>
        <button disabled={saving} className="mt-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-60 sm:col-span-2">{saving ? "Saving address…" : "Save delivery address"}</button>
      </div>
    </form>}

    {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading your addresses…</p> : !addresses.length ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><FiMapPin className="mx-auto text-3xl text-slate-300"/><h2 className="mt-3 font-bold text-slate-800">No saved addresses yet</h2><p className="mt-1 text-sm text-slate-500">Add an address or use your current location for faster checkout.</p></div> : <div className="mt-6 grid gap-3 sm:grid-cols-2">{addresses.map(address=><article key={address._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-50 text-xl text-lime-800"><FiMapPin/></span><button type="button" onClick={()=>deleteAddress(address._id)} aria-label="Delete address" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><FiTrash2/></button></div><h3 className="mt-4 font-extrabold text-slate-900">{address.address_line}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{address.city}, {address.state} - {address.pincode}<br/>{address.country}</p><p className="mt-3 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">Mobile · {address.mobile}</p></article>)}</div>}
  </section>;
}
