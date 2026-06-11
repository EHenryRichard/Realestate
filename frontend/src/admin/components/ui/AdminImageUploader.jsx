import { useState } from "react";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast.jsx";
import { adminUploadApi } from "../../api/adminUploadApi.js";

function AdminImageUploader({ label = "Main image path", name = "mainImage", onChange, value = "" }) {
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const deleteUnusedUpload = (path) => {
    if (!path) {
      return;
    }

    adminUploadApi.deleteUploads(path).catch(() => {});
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setIsUploading(true);
    const toastId = showLoading("Uploading image...");

    try {
      const response = await adminUploadApi.uploadImages([file]);
      const uploadedImage = response?.data || response;
      const imageUrl = uploadedImage?.url || uploadedImage?.path || "";

      if (imageUrl) {
        const previousValue = value;
        onChange({ target: { name, value: imageUrl } });
        if (previousValue !== imageUrl) {
          deleteUnusedUpload(previousValue);
        }
      }
      dismissToast(toastId);
      showSuccess("Image uploaded successfully.");
    } catch (caughtError) {
      setError(caughtError.message);
      dismissToast(toastId);
      showError(caughtError.message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleClear = () => {
    const previousValue = value;

    onChange({ target: { name, value: "" } });
    deleteUnusedUpload(previousValue);
    showSuccess("Image removed.");
  };

  return (
    <div className="block">
      <label className="mb-2 block text-sm font-extrabold text-brand-forest" htmlFor={`${name}-path`}>
        {label}
      </label>
      <input
        id={`${name}-path`}
        className="min-h-12 w-full border border-brand-forest/15 bg-white px-4 text-sm text-brand-charcoal focus:outline-none focus:ring-0"
        name={name}
        onChange={onChange}
        placeholder="/images/properties/example.webp"
        type="text"
        value={value}
      />
      <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center border border-brand-forest bg-brand-forest px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-gold hover:text-white">
        <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileChange} type="file" />
        {isUploading ? "Uploading image..." : "Upload image"}
      </label>
      {error ? <p className="mt-2 text-sm font-bold text-red-700">{error}</p> : null}
      {value ? (
        <div className="mt-3 border border-brand-forest/10 bg-brand-cream p-2">
          <img alt="" className="h-28 w-full object-cover" src={value} />
          <button
            className="mt-2 min-h-10 w-full border border-brand-forest bg-brand-forest px-3 text-xs font-extrabold uppercase text-white transition-colors hover:bg-brand-gold hover:text-white"
            onClick={handleClear}
            type="button"
          >
            Remove image
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default AdminImageUploader;
