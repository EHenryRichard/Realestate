import { useEffect, useMemo, useState } from "react";
import { propertyApi } from "../api/propertyApi.js";
import { apiConfig } from "../config/apiConfig.js";
import { propertiesData } from "../data/propertiesData.js";
import { filterProperties, getPropertyFilterOptions } from "../utils/filterProperties.js";

const normalizeProperty = (property = {}) => ({
  ...property,
  image: property.image || property.mainImage || "",
  type: property.type || property.propertyType || "",
  featured: property.featured ?? property.isFeatured ?? false,
  gallery: property.gallery || property.galleryImages || [],
  videoUrl: property.videoUrl || "",
  videoPoster: property.videoPoster || "",
});

export const useProperties = ({ filters = {}, featured = false, slug = "" } = {}) => {
  const [properties, setProperties] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filterSignature = JSON.stringify(filters);

  useEffect(() => {
    let active = true;

    const loadProperties = async () => {
      setLoading(true);
      setError("");

      try {
        let response;

        if (apiConfig.useApi) {
          if (slug) {
            response = await propertyApi.getBySlug(slug);
          } else if (featured) {
            response = await propertyApi.getFeatured();
          } else {
            response = await propertyApi.getAll(filters);
          }
        } else {
          response = propertiesData;
        }

        if (!active) {
          return;
        }

        const responseData = Array.isArray(response) ? response : response?.data ?? response;
        const source = (Array.isArray(responseData) ? responseData : []).map(normalizeProperty);

        if (slug) {
          const matchedProperty = Array.isArray(responseData)
            ? source.find((item) => item.slug === slug)
            : normalizeProperty(responseData);
          setProperty(matchedProperty || null);
          setProperties(source);
        } else {
          const nextProperties = featured ? source.filter((item) => item.featured) : filterProperties(source, filters);
          setProperties(nextProperties);
          setProperty(null);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setProperties([]);
          setProperty(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProperties();

    return () => {
      active = false;
    };
  }, [featured, filterSignature, slug]);

  const options = useMemo(() => getPropertyFilterOptions(propertiesData), []);

  return {
    properties,
    property,
    loading,
    error,
    empty: !loading && !error && properties.length === 0 && !property,
    options,
  };
};
