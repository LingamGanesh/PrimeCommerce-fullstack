import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { logout } from "../store/UserSlice";
import toast from "react-hot-toast";
import AxiosToastError from "../utils/AxiosToastError";

export const Usermenu = ({ onNavigate = () => {}, onClose = onNavigate }) => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const response = await Axios({ ...SummaryApi.logout });
      if (response.data.success) {
        dispatch(logout());
        localStorage.clear();
        toast.success(response.data.message);
      }
    } catch (error) { AxiosToastError(error); }
  };

  const links = [
    { to: "/dashboard/profile", icon: "◉", label: "Profile", description: "Personal information" },
    { to: "/dashboard/myorders", icon: "▣", label: "My orders", description: "Orders & live tracking" },
    { to: "/dashboard/address", icon: "⌖", label: "Saved addresses", description: "Manage delivery locations" },
    { to: "/dashboard/support", icon: "?", label: "Help & support", description: "Get assistance" },
  ];

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,.06)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#14251c] via-[#1e3828] to-[#31532d] p-5 pr-14 text-white">\n        <button type="button" onClick={onClose} aria-label="Close profile menu" className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-xl leading-none text-white transition hover:bg-white/20">×</button>
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[22px] border-lime-200/10" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 text-lg font-black text-lime-200">
            {user?.avatar?.startsWith("http") ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : (user?.name || "C").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0"><p className="truncate text-base font-extrabold">{user?.name || "Guest User"}</p><p className="mt-1 truncate text-xs text-emerald-100/75">{user?.mobile || user?.email || "Welcome to PrimeCommerce"}</p></div>
        </div>
        <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-lime-100/75">Your account</span><span className="rounded-full bg-lime-300/15 px-2.5 py-1 text-[10px] font-bold text-lime-200">Member</span></div>
      </div>
      <nav className="space-y-1 p-3" aria-label="Customer account navigation">
        {links.map((item) => {
          const active = location.pathname === item.to;
          return <Link key={item.to} to={item.to} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${active ? "bg-lime-50 text-emerald-900 ring-1 ring-lime-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg font-bold ${active ? "bg-[#c9f24a] text-slate-950" : "bg-slate-100 text-slate-500 group-hover:bg-lime-100 group-hover:text-emerald-800"}`}>{item.icon}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{item.label}</span><span className="mt-0.5 block text-[11px] text-slate-400">{item.description}</span></span>
            <span className={`text-lg transition-transform group-hover:translate-x-0.5 ${active ? "text-emerald-700" : "text-slate-300"}`}>›</span>
          </Link>;
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <Link to="/" onClick={onNavigate} className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"><span className="text-lg">⌂</span> Continue shopping</Link>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50"><span className="text-lg">↪</span> Sign out</button>
      </div>
    </div>
  );
};
