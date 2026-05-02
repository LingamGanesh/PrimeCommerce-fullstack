import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import { updateAvatar } from "../store/UserSlice";
import toast from "react-hot-toast";

const UserProfileAvatarEdit = ({ close }) => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);
    try {
      const response = await Axios({
        ...SummaryApi.uploadAvathar,
        data: formData,
      });

      console.log("UPLOAD RESPONSE:", response.data);

      const url =
        response?.data?.data?.avatar ||
        response?.data?.data?.avathar;

      dispatch(updateAvatar(url));

      toast.success("Avatar Updated ✅");
      close();
    } catch (error) {
      console.error(error);
      toast.error("Upload Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white p-6 rounded-2xl w-[320px] text-center">

        <h2 className="font-bold mb-4">Update Avatar</h2>

        {/* Preview */}
        <div className="flex justify-center mb-4">
          {(preview || user?.avatar) ? (
            <img
              src={preview || user.avatar}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <FaUserCircle size={80} />
          )}
        </div>

        {/* Upload */}
        <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer block">
          {loading ? "Uploading..." : "Choose Image"}
          <input
            type="file"
            className="hidden"
            onChange={handleUploadAvatar}
          />
        </label>

        <button onClick={close} className="mt-3 text-gray-500">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UserProfileAvatarEdit;