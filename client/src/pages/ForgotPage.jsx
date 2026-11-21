import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMail, FiShield, FiLock } from "react-icons/fi";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";

export default function ForgotPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return toast.error("Please enter your registered email");
    setIsSubmitting(true);
    try {
      const response = await Axios({ ...SummaryApi.forgot_password, data: { email: normalizedEmail } });
      if (response.data?.error) return toast.error(response.data.message || "Unable to send reset code");
      if (response.data?.success) {
        toast.success("Password reset code sent to your email");
        navigate("/verification-page", { state: { email: normalizedEmail } });
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[#f4f7ed] px-4 py-12">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-lime-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-emerald-100/80 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_30px_100px_-40px_rgba(15,23,42,.35)] md:grid-cols-[1fr_1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#111b16] p-10 text-white md:flex">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[36px] border-lime-300/10" />
          <div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#c9f24a] text-xl font-black text-slate-950">P</span><div><p className="font-extrabold tracking-tight">PrimeCommerce</p><p className="text-xs text-white/50">Quick commerce, made simple</p></div></div>
          <div className="relative py-12"><span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1.5 text-xs font-semibold text-lime-200"><FiShield /> Account security</span><h1 className="mt-6 text-4xl font-black leading-tight tracking-tight">Your account.<br/><span className="text-[#c9f24a]">Your control.</span></h1><p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">We’ll help you securely get back into your PrimeCommerce account with a one-time verification code.</p></div>
          <p className="relative text-xs text-white/40">Secure password recovery · OTP expires in 10 minutes</p>
        </section>
        <section className="p-7 sm:p-10 lg:p-12">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"><FiArrowLeft/> Back to login</Link>
          <div className="mt-10 grid h-14 w-14 place-items-center rounded-2xl bg-lime-50 text-2xl text-lime-800"><FiLock/></div>
          <p className="mt-7 text-xs font-extrabold uppercase tracking-[.2em] text-lime-700">Password recovery</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Forgot password?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Enter the email address linked to your account. We’ll send you a secure 6-digit OTP.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-bold text-slate-700">Email address
              <span className="relative mt-2 block"><FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input type="email" name="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-100"/></span>
            </label>
            <button type="submit" disabled={isSubmitting || !email.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9f24a] px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-lime-200/60 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Sending secure code…" : "Send verification code"}</button>
          </form>
          <p className="mt-8 text-center text-sm text-slate-500">Remember your password? <Link to="/login" className="font-extrabold text-slate-900 hover:text-lime-700">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
