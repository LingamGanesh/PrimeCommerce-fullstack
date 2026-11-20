import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your email address…')

  useEffect(() => {
    let active = true
    const code = searchParams.get('code')

    if (!code) {
      setStatus('error')
      setMessage('This verification link is invalid or incomplete.')
      return () => { active = false }
    }

    Axios({
      ...SummaryApi.verifyEmail,
      data: { code },
    }).then((response) => {
      if (!active) return
      setStatus('success')
      setMessage(response.data?.message || 'Your email has been verified.')
    }).catch((error) => {
      if (!active) return
      setStatus('error')
      setMessage(error.response?.data?.message || 'We could not verify this email link.')
    })

    return () => { active = false }
  }, [searchParams])

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="mb-3 text-2xl font-semibold text-gray-800">
          {status === 'success' ? 'Email verified' : status === 'error' ? 'Verification failed' : 'Verify your email'}
        </h1>
        <p className="mb-6 text-sm text-gray-600" role="status">{message}</p>
        {status !== 'verifying' && (
          <Link to="/login" className="inline-block rounded-md bg-green-600 px-5 py-2 text-white hover:bg-green-700">
            Continue to login
          </Link>
        )}
      </div>
    </section>
  )
}
