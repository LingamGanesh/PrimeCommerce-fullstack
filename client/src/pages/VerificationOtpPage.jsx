import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const VerificationOtpPage = () => {

  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef([])

  useEffect(() => {
    if (!location?.state?.email) {
      navigate('/forgot-password')
    }
  }, [location?.state?.email, navigate])

  const [data, setData] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (data.join('').length !== 6) {
      toast.error('Enter the complete 6-digit OTP')
      return
    }
    setIsSubmitting(true)
    try {
      const response = await Axios({
        ...SummaryApi.forgot_password_verification_otp,
        data: {
          otp: data.join(''),
          email: location?.state?.email
        }
      })

      if (response.data?.error) {
        toast.error(response.data.message)
      }

      if (response.data?.success) {
        toast.success(response.data.message)
        navigate('/reset-password',{
           state :{
          data: response.data,
          email:  location?.state?.email
        }
        })
       
        
      }

    } catch (error) {
      AxiosToastError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">

        <h1 className="text-2xl font-semibold text-gray-800 text-center mb-2">
          OTP Verification
        </h1>

        <p className="text-sm text-gray-600 text-center mb-6">
          Enter the 6-digit OTP sent to your email
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* OTP Inputs */}
          <div className="flex justify-center gap-2">
            {data.map((value, index) => (
              <input
                key={`otp-${index}`}
                ref={(ref) => inputRef.current[index] = ref}
                type="text"
                value={value}
                maxLength={6}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                  const next = [...data]
                  if (digits.length > 1) {
                    digits.split('').forEach((digit, offset) => { if (index + offset < 6) next[index + offset] = digit })
                    setData(next)
                    inputRef.current[Math.min(index + digits.length, 5)]?.focus()
                    return
                  }
                  next[index] = digits
                  setData(next)
                  if (digits && index < 5) inputRef.current[index + 1]?.focus()
                }}
                onKeyDown={(e) => { if (e.key === 'Backspace' && !data[index] && index > 0) inputRef.current[index - 1]?.focus() }}
                className="w-12 h-12 text-center text-lg font-semibold border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={isSubmitting || data.join('').length !== 6}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {isSubmitting ? 'Verifying…' : 'Verify OTP'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-6">
          Already have an account?
          <Link to="/login" className="text-blue-600 font-medium ml-1 hover:underline">
            Login
          </Link>
        </p>

      </div>
    </section>
  )
}

export default VerificationOtpPage
