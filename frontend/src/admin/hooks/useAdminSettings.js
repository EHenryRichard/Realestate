import { useEffect, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { siteConfig } from "../../config/siteConfig.js";
import { adminSettingsApi } from "../api/adminSettingsApi.js";

const normalizeSettings = (settings) => ({
  ...settings,
  whatsappNumber: settings.whatsappNumber || settings.whatsapp || "",
});

export function useAdminSettings() {
  const [settings, setSettings] = useState(() => normalizeSettings(siteConfig));
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setSettings(normalizeSettings(siteConfig));
      return undefined;
    }

    let active = true;

    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminSettingsApi.get();

        if (active) {
          setSettings(normalizeSettings(response?.data || siteConfig));
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  return {
    error,
    isLoading,
    settings,
  };
}
