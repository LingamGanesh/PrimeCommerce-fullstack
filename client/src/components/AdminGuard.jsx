import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import fetchUserDetails from "../utils/fetchUserDetails";
import { setUserDetails } from "../store/UserSlice";

export default function AdminGuard() {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user?._id) return undefined;

    let active = true;
    fetchUserDetails()
      .then((response) => {
        if (!active) return;
        if (response?.data) dispatch(setUserDetails(response.data));
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => { active = false; };
  }, [dispatch, user?._id]);

  if (!user?._id && checking) return <div className="min-h-screen grid place-items-center text-gray-500">Verifying admin access…</div>;
  if (user?.role !== "admin" || user?.status !== "active") return <Navigate to="/login" replace />;
  return <Outlet />;
}
