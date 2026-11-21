import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [result, setResult] = useState(() => code
    ? { status: "verifying", message: "Verifying your email address…" }
    : { status: "error", message: "This verification link is invalid or incomplete." }
  );

  useEffect(() => {
    if (!code) return undefined;
    let active = true;
    Axios({ ...SummaryApi.verifyEmail, data: { code } })
      .then((response) => {
        if (active) setResult({
          status: "success",
          message: response.data?.message || "Your email has been verified.",
        });
      })
      .catch((error) => {
        if (active) setResult({
          status: "error",
          message: error.response?.data?.message || "We could not verify this email link.",
        });
      });
    return () => { active = false; };
  }, [code]);

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="mb-3 text-2xl font-semibold text-gray-800">
          {result.status === "success" ? "Email verified" : result.status === "error" ? "Verification failed" : "Verify your email"}
        </h1>
        <p className="mb-6 text-sm text-gray-600" role="status">{result.message}</p>
        {result.status !== "verifying" && <Link to="/login" className="inline-block rounded-md bg-green-600 px-5 py-2 text-white hover:bg-green-700">Continue to login</Link>}
      </div>
    </section>
  );
}
