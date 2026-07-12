import { useEffect, useState } from "react";
import { aboutApi } from "../api/aboutApi.js";
import { apiConfig } from "../config/apiConfig.js";
import { aboutContent as fallbackContent } from "../content/aboutContent.js";

// Merge the admin-saved content over the bundled defaults, one section at a time,
// so a missing section (or an empty DB row) always falls back to the shipped copy.
const mergeContent = (saved) => {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    return fallbackContent;
  }
  return { ...fallbackContent, ...saved };
};

export const useAbout = () => {
  const [content, setContent] = useState(fallbackContent);
  const [loading, setLoading] = useState(apiConfig.useApi);

  useEffect(() => {
    if (!apiConfig.useApi) {
      return undefined;
    }

    let active = true;
    const load = async () => {
      try {
        const res = await aboutApi.get();
        const saved = res?.data?.content ?? null;
        if (active) {
          setContent(mergeContent(saved));
        }
      } catch {
        if (active) {
          setContent(fallbackContent);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return { content, loading };
};
