import { useEffect, useState } from "react";
import { Image, Trash3, Upload } from "react-bootstrap-icons";
import { getImageUrl } from "../../../utils/getImageUrl.js";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast.jsx";
import { adminUploadApi } from "../../api/adminUploadApi.js";
import AdminUploadProgress from "./AdminUploadProgress.jsx";

function AdminImageUploader({ label = "Main image", name = "mainImage", onChange, value = "" }) {
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [processingSeconds, setProcessingSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const previewUrl = value ? getImageUrl(value, "") : "";

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
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setIsUploading(true);
    setUploadProgress(0);
    const toastId = showLoading("Uploading image...");

    try {
      const response = await adminUploadApi.uploadImages([file], setUploadProgress);
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
      setUploadProgress(0);
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
    <div className="block min-w-0 w-full max-w-full">
      <p className="mb-2 text-sm font-extrabold text-brand-forest">
        {label}
      </p>

      <div className="min-w-0 max-w-full overflow-hidden border border-brand-forest/10 bg-brand-cream">
        {previewUrl ? (
          <img alt="" className="aspect-video w-full object-cover" src={previewUrl} />
        ) : (
          <div className="grid aspect-video place-items-center text-brand-muted">
            <Image aria-hidden="true" className="h-8 w-8" />
          </div>
        )}
        <div className="grid gap-2 border-t border-brand-forest/10 bg-white p-2 sm:grid-cols-2">
          <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-brand-forest bg-brand-forest px-3 text-center text-xs font-extrabold uppercase text-white transition-colors hover:bg-brand-emerald hover:!text-white">
            <Upload aria-hidden="true" className="h-4 w-4" />
            <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileChange} type="file" />
            {isUploading ? "Uploading..." : value ? "Replace" : "Upload"}
          </label>
          <button
            className="flex min-h-10 items-center justify-center gap-2 border border-red-800 px-3 text-xs font-extrabold uppercase text-red-800 transition-colors hover:bg-red-800 hover:text-white disabled:pointer-events-none disabled:opacity-45"
            disabled={!value}
            onClick={handleClear}
            type="button"
          >
            <Trash3 aria-hidden="true" className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>

      {isUploading ? (
        <AdminUploadProgress
          elapsedSeconds={uploadProgress >= 100 ? processingSeconds : undefined}
          label={uploadProgress >= 100 ? "Optimizing image" : "Uploading image"}
          progress={uploadProgress}
        />
      ) : null}
      {error ? <p className="mt-2 text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

export default AdminImageUploader;
