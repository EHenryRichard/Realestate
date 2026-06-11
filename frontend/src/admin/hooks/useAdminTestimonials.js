import { useEffect, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { testimonialsData } from "../../data/testimonialsData.js";
import { adminTestimonialApi } from "../api/adminTestimonialApi.js";

const normalizeTestimonial = (testimonial) => ({
  ...testimonial,
  clientRole: testimonial.clientRole || testimonial.clientType || "Client",
  isVisible: testimonial.isVisible ?? true,
});

export function useAdminTestimonials() {
  const [testimonials, setTestimonials] = useState(() => testimonialsData.map(normalizeTestimonial));
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setTestimonials(testimonialsData.map(normalizeTestimonial));
      return undefined;
    }

    let active = true;

    const loadTestimonials = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminTestimonialApi.list();
        const nextTestimonials = (response?.data || []).map(normalizeTestimonial);

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
          setIsLoading(false);
        }
      }
    };

    loadTestimonials();

    return () => {
      active = false;
    };
  }, []);

  return {
    error,
    isLoading,
    testimonials,
  };
}
