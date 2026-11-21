import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import fetchUserDetails from "../utils/fetchUserDetails";
import { setUserDetails } from "../store/UserSlice";

export default function StaffGuard({ role }) {
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

  if (!user?._id && checking) return <div className="grid min-h-screen place-items-center text-slate-500">Verifying staff access…</div>;
  if (user?.role !== role || user?.status !== "active") return <Navigate to="/login" replace />;
  return <Outlet />;
}
