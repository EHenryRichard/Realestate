import { useEffect, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { faqsData } from "../../data/faqsData.js";
import { adminFaqApi } from "../api/adminFaqApi.js";

const normalizeFaq = (faq) => ({
  ...faq,
  sortOrder: faq.sortOrder ?? faq.sort_order ?? 0,
  isVisible: faq.isVisible ?? true,
});

export function useAdminFaqs() {
  const [faqs, setFaqs] = useState(() => faqsData.map(normalizeFaq));
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setFaqs(faqsData.map(normalizeFaq));
      return undefined;
    }

    let active = true;

    const loadFaqs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminFaqApi.list();
        const nextFaqs = (response?.data || []).map(normalizeFaq);

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
          setIsLoading(false);
        }
      }
    };

    loadFaqs();

    return () => {
      active = false;
    };
  }, []);

  return { error, isLoading, faqs };
}
