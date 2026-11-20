import React, { useState } from 'react'
import { FaEyeSlash, FaEye } from "react-icons/fa";
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {

  const navigate = useNavigate();

  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (data.password !== data.confirmPassword) {
      toast.error("Password and Confirm Password must match");
      return;
    }

    try {
      const response = await Axios({
        ...SummaryApi.register,
        data: {
          name: data.name,
          email: data.email,
          password: data.password
        }
      });

      if (response.data.error) {
        toast.error(response.data.message);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/login');
      }

    } catch (error) {
      AxiosToastError(error);
    }
  };

  return (
    <section className="flex min-h-[75vh] items-center justify-center bg-[#f7f8f3] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-green-950/5 sm:p-9">

        <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-[.2em] text-green-700">PrimeCommerce · Join us</p>
        <h1 className="text-center text-3xl font-black tracking-tight text-slate-900 mb-6">
          Create your account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={data.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                required
              />
              <span
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={data.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                required
              />
              <span
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500"
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#123d2a] py-3 font-extrabold text-white shadow-sm transition hover:bg-green-900 disabled:opacity-60"
          >
            Register
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?
          <Link to="/login" className="ml-1 font-extrabold text-green-800 hover:underline">
            Login
          </Link>
        </p>

      </div>
    </section>
  );
};

export default RegisterPage;
