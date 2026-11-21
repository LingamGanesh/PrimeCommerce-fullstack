import { useEffect, useState } from "react";
import { FiArrowLeft, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiShield } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState({ email: location.state?.email || "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validValue = data.newPassword.length >= 8 && data.newPassword.length <= 128 && data.newPassword === data.confirmPassword;

  useEffect(() => {
    if (!location.state?.data?.success || !location.state?.email) navigate("/forgot-password", { replace: true });
  }, [location.state, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (data.newPassword.length < 8 || data.newPassword.length > 128) return toast.error("Password must be between 8 and 128 characters");
    if (data.newPassword !== data.confirmPassword) return toast.error("Passwords do not match");
    setIsSubmitting(true);
    try {
      const response = await Axios({ ...SummaryApi.resetPassword, data });
      if (response.data?.error) return toast.error(response.data.message || "Unable to reset password");
      toast.success(response.data?.message || "Password updated successfully");
      navigate("/login", { replace: true });
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-12 text-sm outline-none transition focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-100";

  return (
    <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[#f4f7ed] px-4 py-12">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-lime-200/60 blur-3xl"/>
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-emerald-100/80 blur-3xl"/>
      <section className="relative w-full max-w-xl rounded-[2rem] border border-white bg-white p-7 shadow-[0_30px_100px_-40px_rgba(15,23,42,.35)] sm:p-11">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><FiArrowLeft/> Back to login</Link>
        <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-lime-50 text-3xl text-lime-800"><FiLock/></div>
        <div className="mt-6 text-center"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><FiShield/> OTP verified</span><h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Create new password</h1><p className="mt-2 text-sm leading-6 text-slate-500">Choose a strong password to secure your PrimeCommerce account.</p>{data.email && <p className="mt-3 text-xs font-semibold text-slate-500">{data.email}</p>}</div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-bold text-slate-700">New password
            <span className="relative mt-2 block"><input type={showPassword ? "text" : "password"} name="newPassword" minLength={8} maxLength={128} autoComplete="new-password" required value={data.newPassword} onChange={event=>setData(current=>({...current,newPassword:event.target.value}))} placeholder="At least 8 characters" className={inputClass}/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={()=>setShowPassword(value=>!value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 hover:text-slate-800">{showPassword ? <FiEyeOff/> : <FiEye/>}</button></span>
          </label>
          <label className="block text-sm font-bold text-slate-700">Confirm new password
            <span className="relative mt-2 block"><input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" minLength={8} maxLength={128} autoComplete="new-password" required value={data.confirmPassword} onChange={event=>setData(current=>({...current,confirmPassword:event.target.value}))} placeholder="Enter the password again" className={inputClass}/><button type="button" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={()=>setShowConfirmPassword(value=>!value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 hover:text-slate-800">{showConfirmPassword ? <FiEyeOff/> : <FiEye/>}</button></span>
          </label>
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500"><div className="flex items-center gap-2"><FiCheckCircle className={data.newPassword.length >= 8 ? "text-emerald-600" : "text-slate-300"}/> Use 8–128 characters</div><div className="mt-2 flex items-center gap-2"><FiCheckCircle className={data.confirmPassword && data.newPassword === data.confirmPassword ? "text-emerald-600" : "text-slate-300"}/> Both passwords must match</div></div>
          <button type="submit" disabled={!validValue || isSubmitting} className="w-full rounded-xl bg-[#c9f24a] px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-lime-200/60 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Updating password…" : "Update password securely"}</button>
        </form>
        <p className="mt-7 text-center text-xs text-slate-400">Your reset code is time-limited and can only be used once.</p>
      </section>
    </main>
  );
}
