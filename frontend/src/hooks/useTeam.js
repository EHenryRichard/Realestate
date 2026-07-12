import { useEffect, useState } from "react";
import { teamApi } from "../api/teamApi.js";
import { apiConfig } from "../config/apiConfig.js";

// The public "Our Team" list, now driven by admin-managed team profiles.
export const useTeam = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (!apiConfig.useApi) {
          if (active) setMembers([]);
          return;
        }
        const res = await teamApi.getAll();
        const list = res?.data?.data || res?.data || [];
        if (active) setMembers(list);
      } catch (err) {
        if (active) {
          setError(err.message);
          setMembers([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return { members, loading, error, empty: !loading && !error && members.length === 0 };
};
