import { useState } from "react";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast.jsx";
import { adminUploadApi } from "../../api/adminUploadApi.js";

function AdminVideoUploader({
  label = "Property video",
  posterName = "videoPoster",
  posterValue = "",
  videoName = "videoUrl",
  videoValue = "",
  onChange,
}) {
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const deleteUnusedUploads = (paths) => {
    const cleanPaths = paths.filter(Boolean);

    if (!cleanPaths.length) {
      return;
    }

    adminUploadApi.deleteUploads(cleanPaths).catch(() => {});
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setIsUploading(true);
    const toastId = showLoading("Compressing video...");

    try {
      const response = await adminUploadApi.uploadVideos([file]);
      const uploadedVideo = response?.data || response;
      const videoUrl = uploadedVideo?.url || uploadedVideo?.path || "";
      const posterUrl = uploadedVideo?.posterUrl || uploadedVideo?.posterPath || "";

      if (videoUrl) {
        const previousVideoValue = videoValue;
        const previousPosterValue = posterValue;

        onChange({ target: { name: videoName, value: videoUrl } });

        if (posterUrl) {
          onChange({ target: { name: posterName, value: posterUrl } });
        }

        if (previousVideoValue !== videoUrl || previousPosterValue !== posterUrl) {
          deleteUnusedUploads([previousVideoValue, previousPosterValue]);
        }
      }

      dismissToast(toastId);
      showSuccess("Video uploaded and compressed successfully.");
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
    const previousVideoValue = videoValue;
    const previousPosterValue = posterValue;

    onChange({ target: { name: videoName, value: "" } });
    onChange({ target: { name: posterName, value: "" } });
    deleteUnusedUploads([previousVideoValue, previousPosterValue]);
    showSuccess("Video removed.");
  };

  return (
    <div className="block">
      <label className="mb-2 block text-sm font-extrabold text-brand-forest" htmlFor={`${videoName}-path`}>
        {label}
      </label>
      <input
        id={`${videoName}-path`}
        className="min-h-12 w-full border border-brand-forest/15 bg-white px-4 text-sm text-brand-charcoal focus:outline-none focus:ring-0"
        name={videoName}
        onChange={onChange}
        placeholder="/uploads/videos/property-tour.mp4"
        type="text"
        value={videoValue}
      />
      <input
        className="mt-3 min-h-12 w-full border border-brand-forest/15 bg-white px-4 text-sm text-brand-charcoal focus:outline-none focus:ring-0"
        name={posterName}
        onChange={onChange}
        placeholder="/uploads/posters/property-tour-poster.webp"
        type="text"
        value={posterValue}
      />
      <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center border border-brand-forest bg-brand-forest px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-gold hover:text-white">
        <input accept="video/mp4,video/quicktime,video/webm" className="sr-only" onChange={handleFileChange} type="file" />
        {isUploading ? "Compressing video..." : "Upload video"}
      </label>
      {error ? <p className="mt-2 text-sm font-bold text-red-700">{error}</p> : null}
      {videoValue ? (
        <div className="mt-3 border border-brand-forest/10 bg-brand-cream p-2">
          <video className="aspect-video w-full bg-brand-forest object-cover" controls poster={posterValue || undefined} src={videoValue} />
          <button
            className="mt-2 min-h-10 w-full border border-brand-forest bg-brand-forest px-3 text-xs font-extrabold uppercase text-white transition-colors hover:bg-brand-gold hover:text-white"
            onClick={handleClear}
            type="button"
          >
            Remove video
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default AdminVideoUploader;
