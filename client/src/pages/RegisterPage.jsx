import React,{useState} from "react";
import {FaEyeSlash,FaEye} from "react-icons/fa";
import {FiArrowRight,FiMail,FiLock,FiShoppingBag,FiUser,FiZap} from "react-icons/fi";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import {Link,useNavigate} from "react-router-dom";

export default function RegisterPage(){
 const navigate=useNavigate();
 const [data,setData]=useState({name:"",email:"",password:"",confirmPassword:""});
 const [showPassword,setShowPassword]=useState(false),[showConfirmPassword,setShowConfirmPassword]=useState(false),[isSubmitting,setIsSubmitting]=useState(false);
 const handleChange=e=>setData(p=>({...p,[e.target.name]:e.target.value}));
 const handleSubmit=async e=>{
  e.preventDefault();
  if(data.password.length<8||data.password.length>128){toast.error("Password must be between 8 and 128 characters");return;}
  if(data.password!==data.confirmPassword){toast.error("Password and confirm password must match");return;}
  setIsSubmitting(true);
  try{
   const response=await Axios({...SummaryApi.register,data:{name:data.name.trim(),email:data.email.trim().toLowerCase(),password:data.password}});
   if(response.data?.error){toast.error(response.data.message||"Unable to create account");return;}
   if(response.data?.success){toast.success(response.data.message||"Account created. Please verify your email.");navigate("/login",{state:{email:data.email.trim().toLowerCase()}});}
  }catch(error){
   const message=error?.response?.data?.message;AxiosToastError(error);
   if(error?.response?.data?.data?.verificationRequired){toast("This email already has an unverified account. Resend verification from login.");navigate("/login",{state:{email:data.email.trim().toLowerCase(),verificationRequired:true}});}
   else if(message&&error?.response?.status===503){toast.error("Account created, but email delivery failed. Resend verification from login.");navigate("/login",{state:{email:data.email.trim().toLowerCase(),verificationRequired:true}});}
  }finally{setIsSubmitting(false);}
 };
 const field="h-14 w-full rounded-2xl border border-slate-200 bg-[#fbfcf9] px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#9acb28] focus:ring-4 focus:ring-[#c9f24a]/20";
 return <main className="min-h-screen bg-[#f5f7f0] px-4 py-8 sm:px-6 lg:px-10"><div className="mx-auto grid min-h-[720px] max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-[0_24px_80px_rgba(24,32,15,.12)] lg:grid-cols-[.95fr_1.05fr]">
  <section className="relative hidden overflow-hidden bg-[#c9f24a] p-12 lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-24 top-24 h-80 w-80 rounded-full border-[48px] border-white/20"/><div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#a8dc2c]"/>
   <Link to="/" className="relative z-10 flex w-fit items-center gap-3 text-[#17220d]"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17220d] text-2xl text-[#c9f24a]"><FiShoppingBag/></span><span className="text-2xl font-black">PrimeCommerce</span></Link>
   <div className="relative z-10 max-w-lg"><span className="inline-flex items-center gap-2 rounded-full bg-[#17220d]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-[#263817]"><FiZap/> Shop smarter every day</span><h1 className="mt-7 text-6xl font-black leading-[1.05] tracking-tight text-[#17220d]">Good things<br/>are closer.</h1><p className="mt-6 leading-7 text-[#344526]">Create your account to discover fresh picks, quick delivery and a simpler everyday shopping experience.</p><div className="mt-9 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/45 p-4"><p className="text-2xl font-black">01</p><p className="mt-1 text-xs font-bold text-[#344526]">Create your account</p></div><div className="rounded-2xl bg-white/45 p-4"><p className="text-2xl font-black">02</p><p className="mt-1 text-xs font-bold text-[#344526]">Add delivery address</p></div></div></div>
   <p className="relative z-10 text-xs font-bold tracking-widest text-[#344526]/70">FRESH FINDS · EASY PAYMENTS · DOORSTEP DELIVERY</p>
  </section>
  <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14"><div className="w-full max-w-md"><Link to="/" className="mb-8 inline-flex items-center gap-2 text-xl font-black text-[#1c2715] lg:hidden"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c9f24a]"><FiShoppingBag/></span>PrimeCommerce</Link>
   <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#719b20]">Get started</p><h2 className="mt-3 text-4xl font-black tracking-tight text-[#1b2417]">Create your account</h2><p className="mt-3 mb-7 text-sm leading-6 text-slate-500">A few details and you’re ready to shop.</p>
   <form onSubmit={handleSubmit} className="space-y-4">
    <div><label htmlFor="register-name" className="mb-2 block text-sm font-bold text-slate-700">Full name</label><div className="relative"><FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400"/><input id="register-name" name="name" autoComplete="name" value={data.name} onChange={handleChange} placeholder="Enter your full name" className={field+" pl-11"} required/></div></div>
    <div><label htmlFor="register-email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label><div className="relative"><FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400"/><input id="register-email" type="email" name="email" autoComplete="email" value={data.email} onChange={handleChange} placeholder="you@example.com" className={field+" pl-11"} required/></div></div>
    <div><label htmlFor="register-password" className="mb-2 block text-sm font-bold text-slate-700">Password</label><div className="relative"><FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400"/><input id="register-password" type={showPassword?"text":"password"} name="password" autoComplete="new-password" value={data.password} onChange={handleChange} placeholder="At least 8 characters" className={field+" pl-11 pr-12"} required/><button type="button" onClick={()=>setShowPassword(p=>!p)} aria-label="Toggle password visibility" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword?<FaEye/>:<FaEyeSlash/>}</button></div></div>
    <div><label htmlFor="register-confirm" className="mb-2 block text-sm font-bold text-slate-700">Confirm password</label><div className="relative"><FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400"/><input id="register-confirm" type={showConfirmPassword?"text":"password"} name="confirmPassword" autoComplete="new-password" value={data.confirmPassword} onChange={handleChange} placeholder="Enter password again" className={field+" pl-11 pr-12"} required/><button type="button" onClick={()=>setShowConfirmPassword(p=>!p)} aria-label="Toggle confirm password visibility" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showConfirmPassword?<FaEye/>:<FaEyeSlash/>}</button></div></div>
    <p className="text-xs leading-5 text-slate-400">Use 8–128 characters. Verify your email before your first sign-in.</p>
    <button type="submit" disabled={isSubmitting} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#c9f24a] font-black text-[#1c2715] shadow-lg transition hover:bg-[#b9e83b] disabled:opacity-60">{isSubmitting?"Creating your account…":"Create account"}{!isSubmitting&&<FiArrowRight/>}</button>
   </form>
   <p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-extrabold text-[#628b16] hover:underline">Login</Link></p><p className="mt-8 text-center text-xs text-slate-400">Your details are protected and used to manage your PrimeCommerce account.</p>
  </div></section>
 </div></main>;
}