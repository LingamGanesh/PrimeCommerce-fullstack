import React, { useState } from 'react'
import toast from 'react-hot-toast'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useNavigate } from 'react-router-dom'

const ForgotPage = () => {

  const navigate = useNavigate()

  const [data, setData] = useState({
    email: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!data.email) {
      toast.error('Please enter your email')
      return
    }

    try {
      const response = await Axios({
        ...SummaryApi.forgot_password,
        data
      })

      if (response.data?.error) {
        toast.error(response.data.message)
      }

      if (response.data?.success) {
        toast.success(response.data.message)
        navigate('/verification-page', {
          state: data
        })
      }

    } catch (error) {
      AxiosToastError(error)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">

        <h1 className="text-2xl font-semibold text-gray-800 text-center mb-2">
          Forgot Password
        </h1>

        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your registered email to receive OTP
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

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Send OTP
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-6">
          Remember your password?
          <Link to="/login" className="text-blue-600 font-medium ml-1 hover:underline">
            Login
          </Link>
        </p>

      </div>
    </section>
  )
}

export default ForgotPage
