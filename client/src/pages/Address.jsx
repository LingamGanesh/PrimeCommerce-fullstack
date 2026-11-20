import { useCallback, useEffect, useState } from "react";
import Axios from "../utils/Axios";
import toast from "react-hot-toast";

const emptyAddress = {
  address_line: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  mobile: "",
};

export default function Address() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Axios.get("/api/v1/addresses");
      setAddresses(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load saved addresses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(form.pincode) || !/^\d{10}$/.test(form.mobile)) {
      toast.error("Enter a valid 6-digit pincode and 10-digit mobile number");
      return;
    }

    setSaving(true);
    try {
      const response = await Axios.post("/api/v1/addresses", form);
      setAddresses((current) => [response.data.data, ...current]);
      setForm(emptyAddress);
      setShowForm(false);
      toast.success("Address saved successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save address");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id) => {
    setDeletingId(id);
    try {
      await Axios.delete("/api/v1/addresses/" + id);
      setAddresses((current) => current.filter((address) => address._id !== id));
      toast.success("Address deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete address");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Saved addresses</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the places where you receive your orders.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800"
        >
          {showForm ? "Cancel" : "+ Add address"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveAddress} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            House / street / area
            <input required name="address_line" value={form.address_line} onChange={updateField} maxLength={250} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            City
            <input required name="city" value={form.city} onChange={updateField} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            State
            <input required name="state" value={form.state} onChange={updateField} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Pincode
            <input required name="pincode" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={form.pincode} onChange={updateField} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Mobile number
            <input required name="mobile" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" value={form.mobile} onChange={updateField} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Country
            <input required name="country" value={form.country} onChange={updateField} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
          </label>
          <button disabled={saving} className="rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
            {saving ? "Saving…" : "Save address"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Loading addresses…</p>
      ) : addresses.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <article key={address._id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{address.address_line}</h2>
                  <p className="mt-2 text-sm text-slate-600">{address.city}, {address.state} - {address.pincode}</p>
                  <p className="text-sm text-slate-600">{address.country}</p>
                  <p className="mt-2 text-sm text-slate-500">Mobile: {address.mobile}</p>
                </div>
                <button
                  type="button"
                  disabled={deletingId === address._id}
                  onClick={() => deleteAddress(address._id)}
                  className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"
                >
                  {deletingId === address._id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-4xl">📍</p>
          <h2 className="mt-3 font-bold text-slate-900">No saved addresses</h2>
          <p className="mt-1 text-sm text-slate-500">Add an address to make checkout faster.</p>
        </div>
      )}
    </section>
  );
}
