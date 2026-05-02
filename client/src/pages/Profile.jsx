import React, { useState } from "react";
import { useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UserProfileAvatarEdit from "../components/UserProfileAvatarEdit";

const Profile = () => {
  const user = useSelector((state) => state.user);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">

      <div className="bg-white shadow rounded-2xl p-6">

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          {user?.avatar && user.avatar.startsWith("http") ? (
            <img
              src={user.avatar}
              className="w-24 h-24 rounded-full object-cover border"
            />
          ) : (
            <FaUserCircle size={80} className="text-gray-400" />
          )}
        </div>

        <button
          onClick={() => setOpen(true)}
          className="text-blue-500 text-sm mb-4 block mx-auto"
        >
          Edit Avatar
        </button>

        {/* Name */}
        <h2 className="text-xl font-bold text-center">{user?.name}</h2>
        <p className="text-center text-gray-500 mb-6">{user?.email}</p>

        {/* USER DETAILS */}
        <div className="space-y-3 text-sm">

          <div className="flex justify-between border-b pb-2">
            <span>User ID</span>
            <span>{user?._id}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Mobile</span>
            <span>{user?.mobile || "Not added"}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Role</span>
            <span>{user?.role}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Status</span>
            <span>{user?.status}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Email Verified</span>
            <span>{user?.verify_email ? "Yes" : "No"}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Created</span>
            <span>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "-"}
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Last Login</span>
            <span>
              {user?.last_login_date
                ? new Date(user.last_login_date).toLocaleString()
                : "-"}
            </span>
          </div>

        </div>

        {/* CLICKABLE CARDS */}
        <div className="grid grid-cols-3 gap-4 mt-6">

          {/* Address */}
          <div
            onClick={() => navigate("/dashboard/address")}
            className="cursor-pointer bg-green-100 hover:bg-green-200 p-4 rounded-lg text-center"
          >
            <p className="font-bold text-lg">
              {user?.address_details?.length || 0}
            </p>
            <p className="text-sm">Addresses</p>
          </div>

          {/* Orders */}
          <div
            onClick={() => navigate("/dashboard/myorders")}
            className="cursor-pointer bg-blue-100 hover:bg-blue-200 p-4 rounded-lg text-center"
          >
            <p className="font-bold text-lg">
              {user?.orderHistory?.length || 0}
            </p>
            <p className="text-sm">Orders</p>
          </div>

          {/* Cart */}
          <div
            onClick={() => navigate("/dashboard/myorders")}
            className="cursor-pointer bg-yellow-100 hover:bg-yellow-200 p-4 rounded-lg text-center"
          >
            <p className="font-bold text-lg">
              {user?.shopping_cart?.length || 0}
            </p>
            <p className="text-sm">Cart</p>
          </div>

        </div>

      </div>

      {/* Modal */}
      {open && <UserProfileAvatarEdit close={() => setOpen(false)} />}
    </div>
  );
};

export default Profile;