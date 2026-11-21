import React, { useState } from "react";
import { useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UserProfileAvatarEdit from "../components/UserProfileAvatarEdit";

const Profile = () => {
  const user = useSelector((state) => state.user);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const stats = [
    { label: "Saved addresses", value: user?.address_details?.length || 0, detail: "Delivery locations", icon: "⌖", action: () => navigate("/dashboard/address"), tone: "bg-emerald-50 text-emerald-800" },
    { label: "Orders", value: user?.orderHistory?.length || 0, detail: "Your purchases", icon: "▣", action: () => navigate("/dashboard/myorders"), tone: "bg-sky-50 text-sky-800" },
    { label: "Cart items", value: user?.shopping_cart?.length || 0, detail: "Ready to checkout", icon: "🛒", action: () => navigate("/"), tone: "bg-amber-50 text-amber-800" },
  ];

  const details = [
    ["User ID", user?._id || "—"],
    ["Mobile", user?.mobile || "Not added"],
    ["Account role", user?.role || "Customer"],
    ["Account status", user?.status || "—"],
    ["Email verification", user?.verify_email ? "Verified" : "Not verified"],
    ["Member since", user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"],
    ["Last login", user?.last_login_date ? new Date(user.last_login_date).toLocaleString() : "—"],
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#14251c] via-[#1e3828] to-[#31532d] p-6 text-white shadow-[0_16px_36px_rgba(20,37,28,.16)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[32px] border-lime-200/10" />
        <div className="pointer-events-none absolute -bottom-24 right-28 h-44 w-44 rounded-full bg-lime-300/10 blur-2xl" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[28px] border-4 border-white/15 bg-white/10 text-lime-100 shadow-xl">
            {user?.avatar && user.avatar.startsWith("http") ? (
              <img src={user.avatar} alt={user?.name ? `${user.name}'s profile` : "Profile"} className="h-full w-full object-cover" />
            ) : (
              <FaUserCircle size={68} className="text-lime-100/90" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-lime-200/80">PrimeCommerce member</p>
            <h2 className="mt-2 break-words text-2xl font-black tracking-tight sm:text-3xl">{user?.name || "Your profile"}</h2>
            <p className="mt-1 break-all text-sm text-emerald-50/75">{user?.email || "Add an email address to your account"}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-lime-100">{user?.verify_email ? "✓ Email verified" : "Email not verified"}</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold capitalize text-white/90">{user?.role || "Customer"} account</span>
            </div>
          </div>
          <button onClick={() => setOpen(true)} className="relative shrink-0 rounded-xl bg-[#c9f24a] px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-lime-300 focus:outline-none focus:ring-4 focus:ring-lime-200/30">
            Edit avatar
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <button key={stat.label} type="button" onClick={stat.action} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-lime-300">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl font-black ${stat.tone}`}>{stat.icon}</span>
            <span className="min-w-0 flex-1"><span className="block text-2xl font-black tracking-tight text-slate-950">{stat.value}</span><span className="block text-sm font-bold text-slate-700">{stat.label}</span><span className="mt-0.5 block text-xs text-slate-400">{stat.detail}</span></span>
            <span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700">›</span>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">Account information</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">Personal details</h3>
          <p className="mt-1 text-sm text-slate-500">A quick overview of the information associated with your account.</p>
        </div>
        <dl className="grid gap-x-10 px-5 sm:grid-cols-2 sm:px-6">
          {details.map(([label, value]) => (
            <div key={label} className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-100 py-4 last:border-0 sm:[&:nth-last-child(2)]:border-0">
              <dt className="shrink-0 text-sm font-medium text-slate-500">{label}</dt>
              <dd className="min-w-0 break-all text-right text-sm font-bold text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {open && <UserProfileAvatarEdit close={() => setOpen(false)} />}
    </div>
  );
};

export default Profile;
