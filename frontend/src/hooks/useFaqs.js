import { useEffect, useState } from "react";
import { faqApi } from "../api/faqApi.js";
import { apiConfig } from "../config/apiConfig.js";
import { faqsData } from "../data/faqsData.js";

const normalizeFaq = (faq) => ({
  ...faq,
  sortOrder: faq.sortOrder ?? faq.sort_order ?? 0,
  isVisible: faq.isVisible ?? true,
});

export const useFaqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadFaqs = async () => {
      setLoading(true);
      setError("");

      try {
        const response = apiConfig.useApi ? await faqApi.getAll() : faqsData;
        const nextFaqs = (Array.isArray(response) ? response : response?.data || []).map(normalizeFaq);

        if (active) {
          setFaqs(nextFaqs);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setFaqs([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadFaqs();

    return () => {
      active = false;
    };
  }, []);

  return {
    faqs,
    loading,
    error,
    empty: !loading && !error && faqs.length === 0,
  };
};
