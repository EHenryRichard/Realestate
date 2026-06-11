import { useEffect, useState } from "react";
import { serviceApi } from "../api/serviceApi.js";
import { apiConfig } from "../config/apiConfig.js";
import { servicesData } from "../data/servicesData.js";

const normalizeService = (service) => ({
  ...service,
  features: Array.isArray(service.features) ? service.features : [],
  ctaText: service.ctaText || "Learn More",
  link: service.link || `/services#${service.slug || ""}`,
});

export const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      setLoading(true);
      setError("");

      try {
        const response = apiConfig.useApi ? await serviceApi.getAll() : servicesData;
        const nextServices = (Array.isArray(response) ? response : response?.data || []).map(normalizeService);

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
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      active = false;
    };
  }, []);

  return {
    services,
    loading,
    error,
    empty: !loading && !error && services.length === 0,
  };
};
