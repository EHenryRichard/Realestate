import { useEffect } from "react";
import { applySeo } from "../utils/applySeo.js";

export const usePageMeta = (seo) => {
  useEffect(() => {
    applySeo(seo);
  }, [seo]);
};
