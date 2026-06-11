import { useEffect, useState } from "react";
import { testimonialApi } from "../api/testimonialApi.js";
import { apiConfig } from "../config/apiConfig.js";
import { testimonialsData } from "../data/testimonialsData.js";

const normalizeTestimonial = (testimonial) => ({
  ...testimonial,
  clientType: testimonial.clientType || testimonial.clientRole || "Client",
});

export const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadTestimonials = async () => {
      setLoading(true);
      setError("");

      try {
        const response = apiConfig.useApi ? await testimonialApi.getAll() : testimonialsData;
        const nextTestimonials = (Array.isArray(response) ? response : response?.data || []).map(normalizeTestimonial);

        if (active) {
          setTestimonials(nextTestimonials);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setTestimonials([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTestimonials();

    return () => {
      active = false;
    };
  }, []);

  return {
    testimonials,
    loading,
    error,
    empty: !loading && !error && testimonials.length === 0,
  };
};
