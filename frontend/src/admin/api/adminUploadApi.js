import { axiosClient } from "../../api/axiosClient.js";

const getUploadPercent = (progressEvent) => {
  if (!progressEvent.total) {
    return 0;
  }

  return Math.round((progressEvent.loaded * 100) / progressEvent.total);
};

export const adminUploadApi = {
  uploadImages: (files, onProgress) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    return axiosClient.post("/admin/uploads/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress ? (event) => onProgress(getUploadPercent(event)) : undefined,
      timeout: 30000,
    });
  },
  uploadVideos: (files, onProgress) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    return axiosClient.post("/admin/uploads/videos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress ? (event) => onProgress(getUploadPercent(event)) : undefined,
      timeout: 3600000,
    });
  },
  getVideoStatus: (fileId) => axiosClient.get(`/admin/uploads/videos/${fileId}/status`, {
    timeout: 30000,
  }),
  deleteUploads: (paths) => {
    const cleanPaths = Array.isArray(paths) ? paths : [paths];

    return axiosClient.delete("/admin/uploads", {
      data: {
        paths: cleanPaths.map((path) => String(path || "").trim()).filter(Boolean),
      },
    });
  },
};
