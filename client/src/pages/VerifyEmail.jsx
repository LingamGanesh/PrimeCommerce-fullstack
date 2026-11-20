import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Axios from "../utils/Axios";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState(() => token ? "verifying" : "error");
  const [message, setMessage] = useState(() => token ? "Verifying your email address…" : "This verification link is invalid or incomplete.");

  useEffect(() => {
    let active = true;
    if (!token) return undefined;
    Axios.post("/api/user/verify-email", { token })
      .then((response) => {
        if (!active) return;
        setStatus("success");
        setMessage(response.data?.message || "Your email has been verified.");
      })
      .catch((error) => {
        if (!active) return;
        setStatus("error");
        setMessage(error.response?.data?.message || "This verification link is invalid or expired.");
      });
    return () => { active = false; };
  }, [params]);

  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#f7f8f3] px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
        <div className="text-4xl" aria-hidden="true">{status === "success" ? "✓" : status === "error" ? "!" : "…"}</div>
        <h1 className="mt-4 text-2xl font-black text-slate-900">{status === "success" ? "Email verified" : status === "error" ? "Verification failed" : "Verify your email"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        {status !== "verifying" && <Link to="/login" className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Continue to login</Link>}
      </section>
    </main>
  );
}
