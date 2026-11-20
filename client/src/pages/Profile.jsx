import { useState } from "react";
import { useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import UserProfileAvatarEdit from "../components/UserProfileAvatarEdit";

export default function Profile() {
  const user = useSelector(state => state.user);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const initials = (user?.name || "U").trim().charAt(0).toUpperCase();

  const shortcuts = [
    { title: "Saved addresses", description: "Manage delivery locations", count: user?.address_details?.length || 0, icon: "📍", action: () => navigate("/dashboard/address") },
    { title: "My orders", description: "Track and view purchases", count: user?.orderHistory?.length || 0, icon: "📦", action: () => navigate("/dashboard/myorders") },
    { title: "Shopping cart", description: "Review items in your basket", icon: "🛒", action: () => navigate("/cart") }
  ];

  return (
    <main className="min-h-[70vh] bg-[#f7f8f3] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-3xl bg-[#123d2a] p-6 text-white shadow-lg sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-lime-300">Your account</p>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white/20 bg-white/10">
              {user?.avatar?.startsWith("http") ? <img src={user.avatar} alt={user?.name || "Profile"} className="h-full w-full object-cover" /> : user?.avatar ? <img src={user.avatar} alt={user?.name || "Profile"} className="h-full w-full object-cover" /> : <span className="text-4xl font-black text-lime-200">{initials}</span>}
            </div>
            <div className="min-w-0 flex-1"><h1 className="text-3xl font-black">{user?.name || "My profile"}</h1><p className="mt-1 break-all text-sm text-green-100">{user?.email || "Account details"}</p><p className="mt-2 text-xs font-semibold text-lime-200">{user?.role ? String(user.role).toUpperCase() : "CUSTOMER"} ACCOUNT</p></div>
            <button type="button" onClick={() => setOpen(true)} className="rounded-xl bg-lime-300 px-4 py-3 text-sm font-extrabold text-green-950 transition hover:bg-lime-200">Edit profile photo</button>
          </div>
        </div>
        <section className="mt-7"><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black text-slate-900">Account shortcuts</h2><p className="mt-1 text-sm text-slate-500">Everything you need to manage your orders.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {shortcuts.map(item => <button key={item.title} type="button" onClick={item.action} className="rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-xl bg-green-50 text-2xl">{item.icon}</span>{item.count !== undefined && <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">{item.count}</span>}</div><h3 className="mt-4 font-extrabold text-slate-900">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.description}</p></button>)}
          </div>
        </section>
        <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-black text-slate-900">Personal details</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full name</p><p className="mt-1 font-bold text-slate-800">{user?.name || "Not available"}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email address</p><p className="mt-1 break-all font-bold text-slate-800">{user?.email || "Not available"}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mobile number</p><p className="mt-1 font-bold text-slate-800">{user?.mobile || "Not added"}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email verification</p><p className="mt-1 font-bold text-slate-800">{user?.verify_email ? "Verified" : "Not verified"}</p></div>
        </div><div className="mt-5 border-t border-slate-100 pt-4"><Link to="/dashboard/address" className="text-sm font-extrabold text-green-800 hover:text-green-950">Manage delivery addresses →</Link></div></section>
      </div>
      {open && <UserProfileAvatarEdit close={() => setOpen(false)} />}
    </main>
  );
}