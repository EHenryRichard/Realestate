import { useEffect, useState } from "react";
import { Image, Trash3, Upload } from "react-bootstrap-icons";
import { getImageUrl } from "../../../utils/getImageUrl.js";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast.jsx";
import { adminUploadApi } from "../../api/adminUploadApi.js";
import AdminUploadProgress from "./AdminUploadProgress.jsx";

const parseGalleryValues = (currentValue) =>
  String(currentValue || "")
    .split(",")
    .map((image) => image.trim())
    .filter(Boolean);

const joinGalleryValues = (currentValue, uploadedUrls) => {
  const existingUrls = parseGalleryValues(currentValue);

  return [...existingUrls, ...uploadedUrls].join(", ");
};

function AdminGalleryUploader({ label = "Gallery images", name = "galleryImages", onChange, value = "" }) {
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [processingSeconds, setProcessingSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const galleryItems = parseGalleryValues(value);

  useEffect(() => {
    if (!isUploading || uploadProgress < 100) {
      setProcessingSeconds(0);
      return undefined;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setProcessingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isUploading, uploadProgress]);

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
    setUploadProgress(0);
    const toastId = showLoading("Uploading gallery images...");

    try {
      const response = await adminUploadApi.uploadImages(files, setUploadProgress);
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
      setUploadProgress(0);
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
    <div className="block min-w-0 w-full max-w-full">
      <p className="mb-2 text-sm font-extrabold text-brand-forest">
        {label}
      </p>

      {galleryItems.length ? (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {galleryItems.map((imagePath, index) => (
            <div className="min-w-0 overflow-hidden border border-brand-forest/10 bg-brand-cream" key={`${imagePath}-${index}`}>
              <img alt="" className="aspect-video w-full object-cover" src={getImageUrl(imagePath, "")} />
              <button
                className="flex min-h-10 w-full items-center justify-center gap-2 border-t border-brand-forest/10 bg-white px-3 text-xs font-extrabold uppercase text-red-800 transition-colors hover:bg-red-800 hover:text-white"
                onClick={() => handleRemoveGalleryItem(imagePath)}
                type="button"
              >
                <Trash3 aria-hidden="true" className="h-4 w-4" />
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid aspect-video min-w-0 place-items-center border border-brand-forest/10 bg-brand-cream text-brand-muted">
          <Image aria-hidden="true" className="h-8 w-8" />
        </div>
      )}

      <label className="mt-3 flex min-h-12 min-w-0 w-full max-w-full cursor-pointer items-center justify-center gap-2 border border-brand-forest bg-brand-forest px-4 text-center text-sm font-extrabold text-white transition-colors hover:bg-brand-gold hover:text-white">
        <Upload aria-hidden="true" className="h-4 w-4" />
        <input accept="image/jpeg,image/png,image/webp" className="sr-only" multiple onChange={handleFileChange} type="file" />
        {isUploading ? "Uploading..." : galleryItems.length ? "Add Images" : "Upload Images"}
      </label>

      {isUploading ? (
        <AdminUploadProgress
          elapsedSeconds={uploadProgress >= 100 ? processingSeconds : undefined}
          label={uploadProgress >= 100 ? "Optimizing images" : "Uploading images"}
          progress={uploadProgress}
        />
      ) : null}
      {error ? <p className="mt-2 text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

export default AdminGalleryUploader;
