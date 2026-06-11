import { defaultImages } from "../config/defaultImages.js";

export const getFallbackImage = (type = "gallery") => defaultImages[type] || defaultImages.gallery;
