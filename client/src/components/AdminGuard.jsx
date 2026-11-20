import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import fetchUserDetails from "../utils/fetchUserDetails";
import { setUserDetails } from "../store/UserSlice";

export default function AdminGuard() {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(!user?._id);
  const [verified, setVerified] = useState(Boolean(user?._id));

  useEffect(() => {
    let active = true;
    if (user?._id) { setChecking(false); setVerified(true); return () => { active = false; }; }
    fetchUserDetails().then((response) => {
      if (!active) return;
      if (response?.data) { dispatch(setUserDetails(response.data)); setVerified(true); }
      else setVerified(false);
    }).catch(() => { if (active) setVerified(false); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [dispatch, user?._id]);

  if (checking) return <div className="min-h-screen grid place-items-center text-gray-500">Verifying admin access…</div>;
  if (!verified || user?.role !== "admin" || user?.status !== "active") return <Navigate to="/login" replace />;
  return <Outlet />;
}