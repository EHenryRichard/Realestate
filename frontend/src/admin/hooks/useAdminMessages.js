import { useEffect, useMemo, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { adminMessages } from "../data/adminDashboardData.js";
import { adminMessageApi } from "../api/adminMessageApi.js";

const normalize = (value) => String(value || "").toLowerCase();

export function useAdminMessages() {
  const [search, setSearch] = useState("");
  const [sourceMessages, setSourceMessages] = useState(adminMessages);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setSourceMessages(adminMessages);
      return undefined;
    }

    let active = true;

    const loadMessages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminMessageApi.list();

        if (active) {
          setSourceMessages(response?.data || []);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setSourceMessages([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      active = false;
    };
  }, []);

  const messages = useMemo(() => {
    const query = normalize(search);

    return sourceMessages.filter((message) =>
      [message.fullName, message.email, message.phone, message.serviceInterestedIn, message.status]
        .map(normalize)
        .some((value) => value.includes(query)),
    );
  }, [search, sourceMessages]);

  return {
    error,
    isLoading,
    messages,
    search,
    setSearch,
  };
}
