import { useEffect, useRef, useState } from "react";
import { CameraVideo, Trash3, Upload } from "react-bootstrap-icons";
import { getImageUrl } from "../../../utils/getImageUrl.js";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast.jsx";
import { adminUploadApi } from "../../api/adminUploadApi.js";
import AdminUploadProgress from "./AdminUploadProgress.jsx";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_VIDEO_LABEL = "100MB";
const STATUS_POLL_INTERVAL_MS = 2000;

const normalizeVideos = (value) =>
  (Array.isArray(value) ? value : [])
    .map((video) => ({
      url: String(video?.url || "").trim(),
      poster: String(video?.poster || "").trim(),
    }))
    .filter((video) => video.url);

function AdminVideoUploader({ label = "Property videos", name = "videos", onChange, value = [] }) {
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [processingJobs, setProcessingJobs] = useState([]);
  const [processingSeconds, setProcessingSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videos = normalizeVideos(value);
  const videosRef = useRef(videos);
  const isProcessing = processingJobs.length > 0;

  videosRef.current = videos;

  useEffect(() => {
    if (!isProcessing) {
      setProcessingSeconds(0);
      return undefined;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setProcessingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isProcessing]);

  useEffect(() => {
    if (!processingJobs.length) {
      return undefined;
    }

    let cancelled = false;

    const poll = async () => {
      for (const job of processingJobs) {
        let status;

        try {
          const response = await adminUploadApi.getVideoStatus(job.fileId);
          status = response?.data || response;
        } catch {
          // Transient network errors should not abort compression tracking.
          continue;
        }

        if (cancelled) {
          return;
        }

        if (status?.status === "ready") {
          setProcessingJobs((jobs) => jobs.filter((item) => item.fileId !== job.fileId));
          showSuccess("Video compressed and ready.");
        } else if (status?.status === "failed") {
          const message = status?.message || "Video compression failed. Upload the video again.";

          setProcessingJobs((jobs) => jobs.filter((item) => item.fileId !== job.fileId));
          onChange({
            target: {
              name,
              value: videosRef.current.filter((video) => video.url !== job.url),
            },
          });
          setError(message);
          showError(message);
        }
      }
    };

    const timer = window.setInterval(poll, STATUS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingJobs]);

  const deleteUnusedUploads = (paths) => {
    const cleanPaths = paths.filter(Boolean);

    if (!cleanPaths.length) {
      return;
    }

    adminUploadApi.deleteUploads(cleanPaths).catch(() => {});
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const oversized = files.filter((file) => file.size > MAX_VIDEO_BYTES);

    if (oversized.length) {
      const message = `Each video must be ${MAX_VIDEO_LABEL} or smaller.`;

      setError(message);
      showError(message);
      event.target.value = "";
      return;
    }

    setError("");
    setIsUploading(true);
    setUploadProgress(0);
    const toastId = showLoading(files.length > 1 ? "Uploading videos..." : "Uploading video...");

    try {
      const response = await adminUploadApi.uploadVideos(files, setUploadProgress);
      const uploadedData = Array.isArray(response?.data) ? response.data : [response?.data || response];
      const uploadedVideos = uploadedData
        .map((video) => ({
          url: video?.url || video?.path || "",
          poster: video?.posterUrl || video?.posterPath || "",
          fileId: video?.fileId || "",
          status: video?.status || "",
        }))
        .filter((video) => video.url);

      if (uploadedVideos.length) {
        onChange({
          target: {
            name,
            value: [...videos, ...uploadedVideos.map(({ url, poster }) => ({ url, poster }))],
          },
        });

        const newJobs = uploadedVideos
          .filter((video) => video.fileId && video.status === "processing")
          .map((video) => ({ fileId: video.fileId, url: video.url }));

        if (newJobs.length) {
          setProcessingJobs((jobs) => [...jobs, ...newJobs]);
        }
      }

      dismissToast(toastId);
      showSuccess(
        uploadedVideos.length > 1
          ? "Videos uploaded. Compressing in the background..."
          : "Video uploaded. Compressing in the background...",
      );
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

  const handleRemoveVideo = (video) => {
    setProcessingJobs((jobs) => jobs.filter((job) => job.url !== video.url));
    onChange({ target: { name, value: videos.filter((item) => item.url !== video.url) } });
    deleteUnusedUploads([video.url, video.poster]);
    showSuccess("Video removed.");
  };

  const processingUrls = new Set(processingJobs.map((job) => job.url));

  return (
    <div className="block min-w-0 w-full max-w-full">
      <p className="mb-2 text-sm font-extrabold text-brand-forest">
        {label}
      </p>

      {videos.length ? (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {videos.map((video, index) => (
            <div className="min-w-0 overflow-hidden border border-brand-forest/10 bg-brand-cream" key={`${video.url}-${index}`}>
              {processingUrls.has(video.url) ? (
                <div className="grid aspect-video place-items-center text-brand-muted">
                  <p className="px-4 text-center text-xs font-extrabold uppercase">Compressing video...</p>
                </div>
              ) : (
                <video
                  className="aspect-video w-full bg-brand-forest object-cover"
                  controls
                  poster={video.poster ? getImageUrl(video.poster, "") : undefined}
                  src={getImageUrl(video.url, "")}
                />
              )}
              <button
                className="flex min-h-10 w-full items-center justify-center gap-2 border-t border-brand-forest/10 bg-white px-3 text-xs font-extrabold uppercase text-red-800 transition-colors hover:bg-red-800 hover:text-white"
                onClick={() => handleRemoveVideo(video)}
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
          <CameraVideo aria-hidden="true" className="h-8 w-8" />
        </div>
      )}

      <label
        className={`mt-3 flex min-h-12 min-w-0 w-full max-w-full items-center justify-center gap-2 border border-brand-forest bg-brand-forest px-4 text-center text-sm font-extrabold text-white transition-colors hover:bg-brand-gold hover:text-white ${
          isUploading ? "pointer-events-none opacity-45" : "cursor-pointer"
        }`}
      >
        <Upload aria-hidden="true" className="h-4 w-4" />
        <input
          accept="video/mp4,video/quicktime,video/webm"
          className="sr-only"
          disabled={isUploading}
          multiple
          onChange={handleFileChange}
          type="file"
        />
        {isUploading ? "Uploading..." : videos.length ? "Add Videos" : "Upload Videos"}
      </label>

      {isUploading || isProcessing ? (
        <AdminUploadProgress
          elapsedSeconds={isUploading ? undefined : processingSeconds}
          label={
            isUploading
              ? "Uploading videos"
              : `Compressing ${processingJobs.length} video${processingJobs.length > 1 ? "s" : ""} in the background`
          }
          progress={isUploading ? uploadProgress : 100}
        />
      ) : null}
      {error ? <p className="mt-2 text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

export default AdminVideoUploader;
