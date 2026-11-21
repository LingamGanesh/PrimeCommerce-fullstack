import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import { FiCamera, FiUploadCloud, FiX } from "react-icons/fi";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import { updateAvatar } from "../store/UserSlice";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const UserProfileAvatarEdit = ({ close }) => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleUploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return localPreview;
    });

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);
    try {
      const response = await Axios({
        ...SummaryApi.uploadAvathar,
        data: formData,
      });

      const uploadedUrl = response?.data?.data?.avatar;
      if (!response?.data?.success || !uploadedUrl) {
        throw new Error(response?.data?.message || "The server did not return the uploaded photo.");
      }

      dispatch(updateAvatar(uploadedUrl));
      toast.success("Profile photo updated successfully.");
      close();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Could not upload your profile photo.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) close();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="avatar-dialog-title" className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-700">Customer account</p>
            <h2 id="avatar-dialog-title" className="mt-1 text-lg font-black text-slate-950">Update profile photo</h2>
          </div>
          <button type="button" onClick={close} disabled={loading} aria-label="Close dialog" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"><FiX /></button>
        </div>

        <div className="p-6 text-center">
          <div className="mx-auto mb-4 grid h-32 w-32 place-items-center overflow-hidden rounded-full border-4 border-emerald-50 bg-slate-100 text-emerald-800 shadow-inner">
            {(preview || user?.avatar) ? (
              <img src={preview || user.avatar} alt="Profile photo preview" className="h-full w-full object-cover" />
            ) : (
              <FaUserCircle size={104} />
            )}
          </div>
          <p className="text-sm font-bold text-slate-800">{user?.name || "Your profile"}</p>
          <p className="mt-1 text-xs text-slate-500">Choose a clear photo of yourself</p>

          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleUploadAvatar} disabled={loading} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9f24a] px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" /> Uploading photo...</> : <><FiCamera size={17} /> Choose photo</>}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><FiUploadCloud /> JPG, PNG, WEBP · Maximum 5 MB</p>
          <button type="button" onClick={close} disabled={loading} className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>
        </div>
      </section>
    </div>
  );
};

export default UserProfileAvatarEdit;
