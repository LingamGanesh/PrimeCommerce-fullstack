import React, { useState } from 'react'
import { FaEyeSlash, FaEye } from "react-icons/fa"
import toast from 'react-hot-toast'
import Axios from '../utils/Axios.js'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
  const navigate = useNavigate()

  const [data, setData] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!data.email || !data.password) {
      toast.error('Please fill all fields')
      return
    }

    try {
      const response = await Axios.post(
        SummaryApi.login.url,
        {
          email: data.email,
          password: data.password
        }
      )

      if (response.data?.error) {
        toast.error(response.data.message)
        return
      }

      if (response.data?.success) {

        toast.success(response.data.message)
         localStorage.setItem('accesstoken',response.data.data.accesstoken)
            localStorage.setItem('refreshtoken',response.data.data.refreshtoken)
        navigate('/')
      }

    } catch (error) {
      AxiosToastError(error)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">

        <h1 className="text-2xl font-semibold text-gray-800 text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Please login to your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={data.password}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-6">
          Don’t have an account?
          <Link to="/register" className="text-blue-600 font-medium ml-1 hover:underline">
            Register
          </Link>
        </p>

      </div>
    </section>
  )
}

export default Login
