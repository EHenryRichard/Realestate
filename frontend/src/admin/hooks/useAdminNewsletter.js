import { useEffect, useMemo, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { adminNewsletterSubscribers } from "../data/adminDashboardData.js";
import { adminNewsletterApi } from "../api/adminNewsletterApi.js";

export function useAdminNewsletter() {
  const [search, setSearch] = useState("");
  const [sourceSubscribers, setSourceSubscribers] = useState(adminNewsletterSubscribers);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setSourceSubscribers(adminNewsletterSubscribers);
      return undefined;
    }

    let active = true;

    const loadSubscribers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminNewsletterApi.list();

        if (active) {
          setSourceSubscribers(response?.data || []);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setSourceSubscribers([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadSubscribers();

    return () => {
      active = false;
    };
  }, []);

  const subscribers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sourceSubscribers.filter((subscriber) =>
      [subscriber.email, subscriber.status].some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [search, sourceSubscribers]);

  return {
    error,
    isLoading,
    search,
    setSearch,
    subscribers,
  };
}
