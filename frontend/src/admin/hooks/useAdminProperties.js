import { useEffect, useMemo, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { propertiesData } from "../../data/propertiesData.js";
import { adminPropertyApi } from "../api/adminPropertyApi.js";

const normalize = (value) => String(value || "").toLowerCase();
const normalizeProperty = (property) => ({
  ...property,
  type: property.type || property.propertyType || "",
  featured: property.featured ?? property.isFeatured,
});

export function useAdminProperties() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sourceProperties, setSourceProperties] = useState(() => propertiesData.map(normalizeProperty));
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setSourceProperties(propertiesData.map(normalizeProperty));
      return undefined;
    }

    let active = true;

    const loadProperties = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminPropertyApi.list();
        const properties = (response?.data || []).map(normalizeProperty);

        if (active) {
          setSourceProperties(properties);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setSourceProperties([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadProperties();

    return () => {
      active = false;
    };
  }, []);

  const properties = useMemo(() => {
    const query = normalize(search);
    const statusQuery = normalize(status);

    return sourceProperties.filter((property) => {
      const matchesSearch = [property.title, property.location, property.type, property.status]
        .map(normalize)
        .some((value) => value.includes(query));
      const matchesStatus = !statusQuery || normalize(property.status).includes(statusQuery);

      return matchesSearch && matchesStatus;
    });
  }, [search, sourceProperties, status]);

  return {
    error,
    isLoading,
    properties,
    search,
    setSearch,
    setStatus,
    status,
  };
}
