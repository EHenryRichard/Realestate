import { defaultImages } from "../config/defaultImages.js";

export const getImageUrl = (image, fallback = defaultImages.gallery) => {
  if (!image || typeof image !== "string") {
    return fallback;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  if (image.startsWith("/")) {
    return image;
  }

  return `/${image.replace(/^\/+/, "")}`;
};
