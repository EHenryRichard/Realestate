import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearAdminAuthToken,
  getAdminAuthToken,
  setAdminAuthRefreshHandler,
  setAdminAuthToken,
} from "../../api/axiosClient.js";
import { apiConfig } from "../../config/apiConfig.js";
import { adminAuthApi } from "../api/adminAuthApi.js";

const AdminAuthContext = createContext(null);

export const getAdminToken = () => getAdminAuthToken();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(apiConfig.useApi);

  const isAuthenticated = Boolean(accessToken);

  const clearSession = useCallback(() => {
    setAdmin(null);
    setAccessToken("");
    clearAdminAuthToken();
    setAdminAuthRefreshHandler(null);
  }, []);

  const storeSession = useCallback((nextAdmin, nextAccessToken) => {
    setAdmin(nextAdmin);
    setAccessToken(nextAccessToken);
    setAdminAuthToken(nextAccessToken);
  }, []);

  useEffect(() => {
    setAdminAuthToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    window.addEventListener("sureboy:admin-auth-invalid", clearSession);

    return () => {
      window.removeEventListener("sureboy:admin-auth-invalid", clearSession);
    };
  }, [clearSession]);

  const login = useCallback(async ({ email, password }) => {
    if (!email?.trim() || !password?.trim()) {
      throw new Error("Email and password are required.");
    }

    if (apiConfig.useApi) {
      const response = await adminAuthApi.login({ email, password });
      const nextAdmin = response?.data?.admin;
      const nextAccessToken = response?.data?.accessToken;

      if (!nextAdmin || !nextAccessToken) {
        throw new Error("Login response did not include admin session data.");
      }

      storeSession(nextAdmin, nextAccessToken);
      return nextAdmin;
    }

    const nextAdmin = {
      fullName: "Sureboy Admin",
      email: email.trim(),
      role: "Admin",
    };
    const nextAccessToken = `local-admin-access-${Date.now()}`;

    storeSession(nextAdmin, nextAccessToken);

    return nextAdmin;
  }, [storeSession]);

  const signup = useCallback(async ({ fullName, email, password }) => {
    if (!fullName?.trim() || !email?.trim() || !password?.trim()) {
      throw new Error("Name, email, and password are required.");
    }

    if (apiConfig.useApi) {
      const response = await adminAuthApi.signup({ fullName, email, password });
      const nextAdmin = response?.data?.admin;
      const nextAccessToken = response?.data?.accessToken;

      if (!nextAdmin || !nextAccessToken) {
        throw new Error("Signup response did not include admin session data.");
      }

      storeSession(nextAdmin, nextAccessToken);
      return nextAdmin;
    }

    const nextAdmin = {
      fullName: fullName.trim(),
      email: email.trim(),
      role: "Admin",
    };
    const nextAccessToken = `local-admin-access-${Date.now()}`;

    storeSession(nextAdmin, nextAccessToken);
    return nextAdmin;
  }, [storeSession]);

  const refreshSession = useCallback(async () => {
    const response = await adminAuthApi.refresh();
    const nextAdmin = response?.data?.admin;
    const nextAccessToken = response?.data?.accessToken;

    if (!nextAdmin || !nextAccessToken) {
      throw new Error("Refresh response did not include admin session data.");
    }

    storeSession(nextAdmin, nextAccessToken);
    return nextAccessToken;
  }, [storeSession]);

  useEffect(() => {
    setAdminAuthRefreshHandler(apiConfig.useApi ? refreshSession : null);

    return () => {
      setAdminAuthRefreshHandler(null);
    };
  }, [refreshSession]);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setIsCheckingSession(false);
      return undefined;
    }

    let active = true;

    const restoreSession = async () => {
      try {
        await refreshSession();
      } catch {
        clearSession();
      } finally {
        if (active) {
          setIsCheckingSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [clearSession, refreshSession]);

  const logout = useCallback(() => {
    if (apiConfig.useApi && accessToken) {
      adminAuthApi.logout().catch(() => {});
    }

    clearSession();
  }, [accessToken, clearSession]);

  const value = useMemo(
    () => ({
      admin,
      clearSession,
      isCheckingSession,
      isAuthenticated,
      login,
      logout,
      refreshSession,
      signup,
      token: accessToken,
      accessToken,
    }),
    [admin, clearSession, isCheckingSession, isAuthenticated, login, logout, refreshSession, signup, accessToken],
  );

  return createElement(AdminAuthContext.Provider, { value }, children);
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  }

  return context;
}
