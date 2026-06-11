import { useEffect, useMemo, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { getAdminDashboardData } from "../data/adminDashboardData.js";
import { adminDashboardApi } from "../api/adminDashboardApi.js";

export function useAdminDashboard() {
  const fallbackDashboardData = useMemo(() => getAdminDashboardData(), []);
  const emptyApiDashboardData = useMemo(
    () => ({
      ...fallbackDashboardData,
      stats: fallbackDashboardData.stats.map((stat) => ({
        ...stat,
        value: 0,
      })),
      recentProperties: [],
      recentMessages: [],
    }),
    [fallbackDashboardData],
  );
  const [data, setData] = useState(() => (apiConfig.useApi ? emptyApiDashboardData : fallbackDashboardData));
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(apiConfig.useApi);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setData(fallbackDashboardData);
      return undefined;
    }

    let active = true;
    setData(emptyApiDashboardData);

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminDashboardApi.getDashboard();

        if (active) {
          const responseData = response?.data || {};
          setData({
            ...emptyApiDashboardData,
            ...responseData,
            quickActions: responseData.quickActions || fallbackDashboardData.quickActions,
            settings: responseData.settings || fallbackDashboardData.settings,
          });
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [emptyApiDashboardData, fallbackDashboardData]);

  return {
    data,
    error,
    isLoading,
  };
}
