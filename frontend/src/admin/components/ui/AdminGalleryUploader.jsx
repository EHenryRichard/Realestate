import { useState } from "react";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast.jsx";
import { adminUploadApi } from "../../api/adminUploadApi.js";

const parseGalleryValues = (currentValue) =>
  String(currentValue || "")
    .split(",")
    .map((image) => image.trim())
    .filter(Boolean);

const joinGalleryValues = (currentValue, uploadedUrls) => {
  const existingUrls = parseGalleryValues(currentValue);

  return [...existingUrls, ...uploadedUrls].join(", ");
};

function AdminGalleryUploader({ label = "Gallery image paths", name = "galleryImages", onChange, value = "" }) {
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const galleryItems = parseGalleryValues(value);

  const deleteUnusedUpload = (path) => {
    if (!path) {
      return;
    }

    adminUploadApi.deleteUploads(path).catch(() => {});
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    setError("");
    setIsUploading(true);
    const toastId = showLoading("Uploading gallery images...");

    try {
      const response = await adminUploadApi.uploadImages(files);
      const uploadedData = Array.isArray(response?.data) ? response.data : [response?.data || response];
      const uploadedUrls = uploadedData
        .map((image) => image?.url || image?.path)
        .filter(Boolean);

      if (uploadedUrls.length) {
        onChange({ target: { name, value: joinGalleryValues(value, uploadedUrls) } });
      }
      dismissToast(toastId);
      showSuccess("Gallery images uploaded successfully.");
    } catch (caughtError) {
      setError(caughtError.message);
      dismissToast(toastId);
      showError(caughtError.message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveGalleryItem = (imagePath) => {
    const nextValue = galleryItems.filter((item) => item !== imagePath).join(", ");

    onChange({ target: { name, value: nextValue } });
    deleteUnusedUpload(imagePath);
    showSuccess("Gallery image removed.");
  };

  return (
    <div className="block">
      <label className="mb-2 block text-sm font-extrabold text-brand-forest" htmlFor={`${name}-paths`}>
        {label}
      </label>
      <textarea
        id={`${name}-paths`}
        className="min-h-24 w-full border border-brand-forest/15 bg-white px-4 py-3 text-sm text-brand-charcoal focus:outline-none focus:ring-0"
        name={name}
        onChange={onChange}
        placeholder="/images/properties/one.webp, /images/properties/two.webp"
        value={value}
      />
      {galleryItems.length ? (
        <div className="mt-3 grid gap-2">
          {galleryItems.map((imagePath) => (
            <button
              className="flex min-h-10 items-center justify-between border border-brand-forest/15 bg-brand-cream px-3 text-left text-xs font-bold text-brand-forest transition-colors hover:border-brand-forest hover:bg-brand-forest hover:text-white"
              key={imagePath}
              onClick={() => handleRemoveGalleryItem(imagePath)}
              type="button"
            >
              <span className="min-w-0 truncate">{imagePath}</span>
              <span className="ml-3 shrink-0 uppercase">Remove</span>
            </button>
          ))}
        </div>
      ) : null}
      <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center border border-brand-forest bg-brand-forest px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-gold hover:text-white">
        <input accept="image/jpeg,image/png,image/webp" className="sr-only" multiple onChange={handleFileChange} type="file" />
        {isUploading ? "Uploading images..." : "Upload gallery images"}
      </label>
      {error ? <p className="mt-2 text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

export default AdminGalleryUploader;
