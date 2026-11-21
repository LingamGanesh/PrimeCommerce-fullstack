import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaBars, FaTimes, FaShoppingBasket } from "react-icons/fa";
import { Usermenu } from "../components/Usermenu";

const pageTitles = {
  "/dashboard/profile": ["Your profile", "Manage your personal details"],
  "/dashboard/myorders": ["My orders", "Track every order from one place"],
  "/dashboard/address": ["Saved addresses", "Your delivery locations"],
  "/dashboard/support": ["Help & support", "We are here whenever you need us"],
};

const Dashboard = () => {
  const [open, setOpen] = useState(false);
  const user = useSelector((state) => state.user);
  const location = useLocation();
  const [title, subtitle] = pageTitles[location.pathname] || ["Your account", "Everything you need, all in one place"];

  return (
    <div className="min-h-screen bg-[#f6f8f3] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_4px_24px_rgba(15,23,42,.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-lime-50 lg:hidden">
              {open ? <FaTimes /> : <FaBars />}
            </button>
            <a href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#c9f24a] text-xl text-slate-950 shadow-[0_7px_18px_rgba(155,190,46,.25)]"><FaShoppingBasket /></span>
              <span><span className="block text-lg font-black leading-5 tracking-tight">Prime<span className="text-emerald-700">Commerce</span></span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.19em] text-slate-400">Your account</span></span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-medium text-slate-400">Welcome back</p><p className="text-sm font-bold text-slate-800">{user?.name || "Customer"}</p></div>
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-lime-200 bg-lime-50 text-sm font-black text-emerald-900">
              {user?.avatar?.startsWith("http") ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : (user?.name || "C").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:px-8">
        <aside className={`${open ? "fixed inset-x-4 top-[84px] z-50 max-h-[calc(100vh-100px)] overflow-y-auto shadow-2xl" : "hidden"} rounded-[28px] lg:sticky lg:top-24 lg:block lg:h-fit lg:shadow-none`}>
          <Usermenu onNavigate={() => setOpen(false)} />
        </aside>
        {open && <button aria-label="Close navigation overlay" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] lg:hidden" />}
        <main className="min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-emerald-700">Customer space</p><h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Account active</span>
          </div>
          <div className="min-h-[68vh] rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,.045)] sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
