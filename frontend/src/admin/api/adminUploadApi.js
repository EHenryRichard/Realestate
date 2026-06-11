import { axiosClient } from "../../api/axiosClient.js";

export const adminUploadApi = {
  uploadImages: (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    return axiosClient.post("/admin/uploads/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    });
  },
  uploadVideos: (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    return axiosClient.post("/admin/uploads/videos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000,
    });
  },
  deleteUploads: (paths) => {
    const cleanPaths = Array.isArray(paths) ? paths : [paths];

    return axiosClient.delete("/admin/uploads", {
      data: {
        paths: cleanPaths.map((path) => String(path || "").trim()).filter(Boolean),
      },
    });
  },
};
