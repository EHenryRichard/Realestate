import { useEffect, useState } from "react";
import { agentsApi } from "../api/agentsApi.js";
import { apiConfig } from "../config/apiConfig.js";

const FALLBACK = [
  {
    id: "1",
    fullName: "Ifeanyi Okoro",
    title: "Senior Property Agent",
    phone: "+234 803 000 0001",
    bio: "Over 8 years helping families find their perfect homes in Warri and across Delta State.",
    photo: "",
    slug: "ifeanyi-okoro",
  },
  {
    id: "2",
    fullName: "Blessing Ejiro",
    title: "Investment Consultant",
    phone: "+234 803 000 0002",
    bio: "Specialising in commercial real estate and high-yield land investments in the Niger Delta.",
    photo: "",
    slug: "blessing-ejiro",
  },
  {
    id: "3",
    fullName: "Chukwuemeka Obi",
    title: "Property Manager",
    phone: "+234 803 000 0003",
    bio: "Ensuring every managed property performs at its best — from maintenance to tenant relations.",
    photo: "",
    slug: "chukwuemeka-obi",
  },
];

export const useAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (!apiConfig.useApi) {
          if (active) setAgents(FALLBACK);
          return;
        }
        const res = await agentsApi.getAll();
        const list = res?.data?.data || res?.data || [];
        if (active) setAgents(list);
      } catch (err) {
        if (active) { setError(err.message); setAgents([]); }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  return { agents, loading, error, empty: !loading && !error && agents.length === 0 };
};
