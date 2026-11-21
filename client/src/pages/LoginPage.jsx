import React, { useState } from 'react'
import { FaEyeSlash, FaEye } from "react-icons/fa"
import toast from 'react-hot-toast'
import Axios from '../utils/Axios.js'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import fetchUserDetails from '../utils/fetchUserDetails.js'
import { useDispatch } from 'react-redux'
import { setUserDetails } from '../store/UserSlice.js'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const [data, setData] = useState({
    email: location.state?.email || '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationRequired, setVerificationRequired] = useState(Boolean(location.state?.verificationRequired))

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

    setIsSubmitting(true)
    setVerificationRequired(false)
    try {
      const response = await Axios.post(
        SummaryApi.login.url,
        {
          email: data.email.trim().toLowerCase(),
          password: data.password
        }
      )

      if (response.data?.error) {
        toast.error(response.data.message)
        return
      }

      if (response.data?.success) {
        const accessToken = response.data?.data?.accessToken
        const refreshToken = response.data?.data?.refreshToken
        if (!accessToken || !refreshToken) {
          throw new Error('Login response did not include authentication tokens')
        }
        localStorage.setItem('accesstoken', accessToken)
        localStorage.setItem('refreshtoken', refreshToken)
        const userDetails = await fetchUserDetails()
        if (!userDetails?.success || !userDetails?.data) {
          localStorage.removeItem('accesstoken')
          localStorage.removeItem('refreshtoken')
          throw new Error('Login succeeded but user details could not be loaded. Please try again.')
        }
        dispatch(setUserDetails(userDetails.data))
        toast.success(response.data.message || 'Login successful')
        const role = userDetails.data.role
        navigate(role === 'admin' ? '/admin' : role === 'picker' ? '/picker' : role === 'rider' ? '/rider' : '/')
      }
    } catch (error) {
      const responseData = error?.response?.data
      if (responseData?.data?.verificationRequired) setVerificationRequired(true)
      if (error.message && !error.response) toast.error(error.message)
      else AxiosToastError(error)
    } finally {
      setIsSubmitting(false)
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
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {isSubmitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        {verificationRequired && <button type="button" onClick={async () => { try { const result = await Axios({ ...SummaryApi.resendVerification, data: { email: data.email.trim().toLowerCase() } }); toast.success(result.data.message || 'Verification email sent') } catch (error) { AxiosToastError(error) } }} className="mt-4 w-full text-sm text-blue-600 underline">Resend verification email</button>}

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
