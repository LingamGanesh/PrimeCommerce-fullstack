import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import Axios from "../utils/Axios"
import SummaryApi from "../common/SummaryApi"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get("code")
  const [status, setStatus] = useState(code ? "verifying" : "invalid")

  useEffect(() => {
    let active = true

    if (!code) return () => { active = false }

    Axios({ ...SummaryApi.verifyEmail, data: { code } })
      .then(({ data }) => {
        if (!active) return
        if (data?.success) {
          setStatus("verified")
          toast.success(data.message || "Email verified successfully")
        } else {
          setStatus("failed")
          toast.error(data?.message || "Email verification failed")
        }
      })
      .catch((error) => {
        if (!active) return
        setStatus("failed")
        toast.error(error?.response?.data?.message || "Email verification failed")
      })

    return () => { active = false }
  }, [code])

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="mb-3 text-2xl font-semibold text-gray-800">Email verification</h1>
        {status === "verifying" && <p className="text-gray-600">Verifying your email address…</p>}
        {status === "verified" && <p className="text-green-700">Your email is verified. You can now log in.</p>}
        {status === "invalid" && <p className="text-red-600">This verification link is missing its code.</p>}
        {status === "failed" && <p className="text-red-600">We could not verify this link. Request a new verification email and try again.</p>}
        <div className="mt-6 flex justify-center gap-4">
          <Link className="text-blue-600 underline" to="/login">Go to login</Link>
          <Link className="text-blue-600 underline" to="/register">Create account</Link>
        </div>
      </div>
    </section>
  )
}
