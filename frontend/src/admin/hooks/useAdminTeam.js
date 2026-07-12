import { useCallback, useEffect, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { adminTeamApi } from "../api/adminTeamApi.js";

export function useAdminTeam() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(apiConfig.useApi);

  const load = useCallback(async () => {
    if (!apiConfig.useApi) {
      setMembers([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminTeamApi.list();
      setMembers(response?.data || []);
    } catch (caughtError) {
      setError(caughtError.message);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { members, error, isLoading, reload: load };
}
