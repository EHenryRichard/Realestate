import { useEffect, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { servicesData } from "../../data/servicesData.js";
import { adminServiceApi } from "../api/adminServiceApi.js";

const normalizeService = (service) => ({
  ...service,
  isActive: service.isActive ?? true,
});

export function useAdminServices() {
  const [services, setServices] = useState(() => servicesData.map(normalizeService));
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setServices(servicesData.map(normalizeService));
      return undefined;
    }

    let active = true;

    const loadServices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminServiceApi.list();
        const nextServices = (response?.data || []).map(normalizeService);

        if (active) {
          setServices(nextServices);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setServices([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      active = false;
    };
  }, []);

  return {
    error,
    isLoading,
    services,
  };
}
