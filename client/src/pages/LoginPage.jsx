import React, { useState } from "react";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { FiArrowRight, FiMail, FiLock, FiShoppingBag, FiZap } from "react-icons/fi";
import toast from "react-hot-toast";
import Axios from "../utils/Axios.js";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import { Link, useLocation, useNavigate } from "react-router-dom";
import fetchUserDetails from "../utils/fetchUserDetails.js";
import { useDispatch } from "react-redux";
import { setUserDetails } from "../store/UserSlice.js";

export default function Login() {
  const navigate=useNavigate(), location=useLocation(), dispatch=useDispatch();
  const [data,setData]=useState({email:location.state?.email||"",password:""});
  const [showPassword,setShowPassword]=useState(false),[isSubmitting,setIsSubmitting]=useState(false),[verificationRequired,setVerificationRequired]=useState(Boolean(location.state?.verificationRequired));
  const handleChange=e=>setData(p=>({...p,[e.target.name]:e.target.value}));
  const handleSubmit=async e=>{
    e.preventDefault();
    if(!data.email.trim()||!data.password){toast.error("Please enter your email and password");return;}
    setIsSubmitting(true);setVerificationRequired(false);
    try{
      const response=await Axios.post(SummaryApi.login.url,{email:data.email.trim().toLowerCase(),password:data.password});
      if(response.data?.error){toast.error(response.data.message||"Unable to sign in");return;}
      if(response.data?.success){
        const accessToken=response.data?.data?.accessToken,refreshToken=response.data?.data?.refreshToken;
        if(!accessToken||!refreshToken)throw new Error("Login response did not include authentication tokens");
        localStorage.setItem("accesstoken",accessToken);localStorage.setItem("refreshtoken",refreshToken);
        const userDetails=await fetchUserDetails();
        if(!userDetails?.success||!userDetails?.data){localStorage.removeItem("accesstoken");localStorage.removeItem("refreshtoken");throw new Error("Profile details could not be loaded. Please try again.");}
        dispatch(setUserDetails(userDetails.data));toast.success(response.data.message||"Welcome back!");
        const role=userDetails.data.role;navigate(role==="admin"?"/admin":role==="picker"?"/picker":role==="rider"?"/rider":"/");
      }
    }catch(error){if(error?.response?.data?.data?.verificationRequired)setVerificationRequired(true);if(error.message&&!error.response)toast.error(error.message);else AxiosToastError(error);}
    finally{setIsSubmitting(false);}
  };
  const resendVerification=async()=>{try{const result=await Axios({...SummaryApi.resendVerification,data:{email:data.email.trim().toLowerCase()}});toast.success(result.data.message||"Verification email sent");}catch(error){AxiosToastError(error);}};
  return <main className="min-h-screen bg-[#f5f7f0] px-4 py-8 sm:px-6 lg:px-10">
    <div className="mx-auto grid min-h-[680px] max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-[0_24px_80px_rgba(24,32,15,.12)] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#c9f24a] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full border-[48px] border-white/20"/><div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#a8dc2c]"/>
        <Link to="/" className="relative z-10 flex w-fit items-center gap-3 text-[#17220d]"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17220d] text-2xl text-[#c9f24a]"><FiShoppingBag/></span><span className="text-2xl font-black">PrimeCommerce</span></Link>
        <div className="relative z-10 max-w-lg"><span className="inline-flex items-center gap-2 rounded-full bg-[#17220d]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-[#263817]"><FiZap/> Quick commerce, made easy</span><h1 className="mt-7 text-6xl font-black leading-[1.05] tracking-tight text-[#17220d]">Your daily needs.<br/>At your door.</h1><p className="mt-6 max-w-md leading-7 text-[#344526]">Fresh groceries, everyday essentials and a smoother way to shop — all in one place.</p></div>
        <p className="relative z-10 text-xs font-bold tracking-widest text-[#344526]/70">FAST CHECKOUT · SECURE PAYMENTS · TRACKED DELIVERY</p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-14"><div className="w-full max-w-md">
        <Link to="/" className="mb-9 inline-flex items-center gap-2 text-xl font-black text-[#1c2715] lg:hidden"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c9f24a]"><FiShoppingBag/></span>PrimeCommerce</Link>
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#719b20]">Welcome back</p><h2 className="mt-3 text-4xl font-black tracking-tight text-[#1b2417]">Login to your account</h2><p className="mt-3 mb-8 text-sm leading-6 text-slate-500">Sign in to continue shopping and manage your orders.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label htmlFor="login-email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label><div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#fbfcf9] px-4 focus-within:border-[#9acb28] focus-within:ring-4 focus-within:ring-[#c9f24a]/20"><FiMail className="text-lg text-slate-400"/><input id="login-email" type="email" name="email" autoComplete="email" value={data.email} onChange={handleChange} placeholder="you@example.com" className="h-full w-full bg-transparent text-sm outline-none" required/></div></div>
          <div><div className="mb-2 flex justify-between"><label htmlFor="login-password" className="text-sm font-bold text-slate-700">Password</label><Link to="/forgot-password" className="text-xs font-bold text-[#628b16] hover:underline">Forgot password?</Link></div><div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#fbfcf9] px-4 focus-within:border-[#9acb28] focus-within:ring-4 focus-within:ring-[#c9f24a]/20"><FiLock className="text-lg text-slate-400"/><input id="login-password" type={showPassword?"text":"password"} name="password" autoComplete="current-password" value={data.password} onChange={handleChange} placeholder="Enter your password" className="h-full w-full bg-transparent text-sm outline-none" required/><button type="button" onClick={()=>setShowPassword(p=>!p)} aria-label={showPassword?"Hide password":"Show password"} className="text-slate-400">{showPassword?<FaEye/>:<FaEyeSlash/>}</button></div></div>
          <button type="submit" disabled={isSubmitting} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#c9f24a] font-black text-[#1c2715] shadow-lg transition hover:bg-[#b9e83b] disabled:opacity-60">{isSubmitting?"Signing you in…":"Login securely"}{!isSubmitting&&<FiArrowRight/>}</button>
        </form>
        {verificationRequired&&<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Verify your email before signing in.</p><button type="button" onClick={resendVerification} className="mt-2 text-sm font-bold text-amber-800 underline">Resend verification email</button></div>}
        <p className="mt-8 text-center text-sm text-slate-500">New to PrimeCommerce? <Link to="/register" className="font-extrabold text-[#628b16] hover:underline">Create an account</Link></p><p className="mt-10 text-center text-xs text-slate-400">Secure sign-in · Your account, your everyday essentials.</p>
      </div></section>
    </div>
  </main>;
}