import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import {logout} from '../store/UserSlice'
import toast from "react-hot-toast";
import AxiosToastError from "../utils/AxiosToastError";
import { FaExternalLinkAlt } from "react-icons/fa";
export const Usermenu = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch()

  const handleLogout = async() =>{
    try{
        const response = await Axios({
            ...SummaryApi.logout
        })
        if(response.data.success){
            dispatch(logout())
            localStorage.clear()
            toast.success(response.data.message)
        }
    }catch(error){
            AxiosToastError(error)
    }

  }

  return (
    <div className="w-72 bg-white shadow-xl rounded-2xl p-4 border border-gray-100">

      {/* Header */}
      <div className="border-b pb-3 mb-3">
        <div className="flex items-center ml-auto gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
          👤 My Account 
        </h2>
        <Link
  to="/dashboard/profile"
  className="font-bold hover:text-blue-500 transition-colors"
>
  <FaExternalLinkAlt />
</Link>
        
        </div>

        <p className="text-sm text-gray-500 mt-1">
          Manage your profile & orders
        </p>
      </div>

      {/* User Info */}
      <div className="bg-green-50 p-3 rounded-xl mb-4">
        <p className="text-gray-700 font-medium">
          {user?.name || "Guest User"}
        </p>

        <p className="text-sm text-gray-500">
          {user?.mobile || user?.email}
        </p>
      </div>

      {/* Links */}
      <div className="flex flex-col gap-2">

        <Link
          to="/dashboard/myorders"
          className="px-3 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          🛒 My Orders
        </Link>

        <Link
          to="/dashboard/address"
          className="px-3 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          📍 Saved Address
        </Link>

        <button
        onClick={handleLogout}
          className="mt-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
        >
          🚪 Log Out
        </button>

      </div>
    </div>
  );
};