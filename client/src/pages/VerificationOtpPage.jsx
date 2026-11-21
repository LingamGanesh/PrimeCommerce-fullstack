import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiShield, FiMail } from "react-icons/fi";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function VerificationOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef([]);
  const [data, setData] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!location.state?.email) navigate("/forgot-password", { replace: true });
  }, [location.state?.email, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (data.join("").length !== 6) return toast.error("Enter the complete 6-digit OTP");
    setIsSubmitting(true);
    try {
      const response = await Axios({ ...SummaryApi.forgot_password_verification_otp, data: { otp: data.join(""), email: location.state.email } });
      if (response.data?.error) return toast.error(response.data.message || "Invalid verification code");
      if (response.data?.success) {
        toast.success(response.data.message || "OTP verified");
        navigate("/reset-password", { state: { data: response.data, email: location.state.email } });
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[#f4f7ed] px-4 py-12">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-lime-200/60 blur-3xl"/>
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-emerald-100/80 blur-3xl"/>
      <section className="relative w-full max-w-xl rounded-[2rem] border border-white bg-white p-7 shadow-[0_30px_100px_-40px_rgba(15,23,42,.35)] sm:p-11">
        <Link to="/forgot-password" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><FiArrowLeft/> Change email</Link>
        <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-lime-50 text-3xl text-lime-800"><FiShield/></div>
        <div className="mt-6 text-center"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><FiMail/> Email verification</span><h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Verify your email</h1><p className="mt-2 text-sm leading-6 text-slate-500">Enter the 6-digit code we sent to your registered email address.</p><p className="mt-3 break-all text-xs font-bold text-slate-700">{location.state?.email}</p></div>
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex justify-center gap-2 sm:gap-3">{data.map((value,index)=><input key={index} ref={ref=>inputRef.current[index]=ref} type="text" inputMode="numeric" autoComplete={index===0?"one-time-code":"off"} aria-label={"OTP digit "+(index+1)} value={value} maxLength={6} onChange={event=>{const digits=event.target.value.replace(/\D/g,"").slice(0,6);const next=[...data];if(digits.length>1){digits.split("").forEach((digit,offset)=>{if(index+offset<6)next[index+offset]=digit});setData(next);inputRef.current[Math.min(index+digits.length,5)]?.focus();return;}next[index]=digits;setData(next);if(digits&&index<5)inputRef.current[index+1]?.focus();}} onKeyDown={event=>{if(event.key==="Backspace"&&!data[index]&&index>0)inputRef.current[index-1]?.focus();}} className="h-12 w-11 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-black text-slate-900 outline-none transition focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-100 sm:h-14 sm:w-12"/>)}</div>
          <p className="mt-4 text-center text-xs text-slate-400">This code expires in 10 minutes.</p>
          <button type="submit" disabled={isSubmitting||data.join("").length!==6} className="mt-7 w-full rounded-xl bg-[#c9f24a] px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-lime-200/60 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting?"Verifying code…":"Verify & continue"}</button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">Remember your password? <Link to="/login" className="font-extrabold text-slate-900 hover:text-lime-700">Sign in</Link></p>
      </section>
    </main>
  );
}
