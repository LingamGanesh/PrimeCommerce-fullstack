import React, { useEffect, useState } from "react"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { Link, useLocation, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import Axios from "../utils/Axios"
import SummaryApi from "../common/SummaryApi"
import AxiosToastError from "../utils/AxiosToastError"

const ResetPassword = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [data, setData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validValue = data.newPassword && data.confirmPassword

  // 🔐 Protect route + set email
  useEffect(() => {
    if (!location?.state?.data?.success) {
      navigate("/", { replace: true })
      return
    }

    if (location?.state?.email) {
      setData(prev => ({
        ...prev,
        email: location.state.email
      }))
    }
  }, [location, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    try {
      const response = await Axios({
        ...SummaryApi.resetPassword,
        data
      })

      if (response.data?.error) {
        toast.error(response.data.message)
        return
      }

      toast.success(response.data.message)
      navigate("/login")

    } catch (error) {
      AxiosToastError(error)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">

        <h1 className="text-2xl font-semibold text-gray-800 text-center mb-2">
          Reset Password
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                value={data.newPassword}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-400"
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

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={data.confirmPassword}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-400"
                required
              />
              <span
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            disabled={!validValue}
            className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700 transition disabled:bg-gray-400"
          >
            Change Password
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-6">
          Remember your password?
          <Link to="/login" className="font-medium ml-1 underline">
            Login
          </Link>
        </p>

      </div>
    </section>
  )
}

export default ResetPassword
