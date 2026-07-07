// useClientAuth.jsx
// React context that holds the logged-in client session for the public site.
// The access token lives only in memory; on load we silently try to restore the
// session from the refresh cookie so a page refresh doesn't log the user out.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearClientAuthToken,
  setClientAuthToken,
  setClientRefreshHandler,
} from "../api/clientAxios.js";
import { clientAuthApi } from "../api/clientAuthApi.js";

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
  const [client, setClient] = useState(null);       // the profile, or null when logged out
  const [accessToken, setAccessToken] = useState(""); // kept in memory only
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const isAuthenticated = Boolean(accessToken);

  // Store a fresh session (called by login/register/refresh).
  const storeSession = useCallback((nextClient, nextToken) => {
    setClient(nextClient);
    setAccessToken(nextToken);
    setClientAuthToken(nextToken); // hand the token to the axios interceptor
  }, []);

  const clearSession = useCallback(() => {
    setClient(null);
    setAccessToken("");
    clearClientAuthToken();
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await clientAuthApi.login({ email, password });
    storeSession(res?.data?.client, res?.data?.accessToken);
    return res?.data?.client;
  }, [storeSession]);

  const register = useCallback(async (payload) => {
    const res = await clientAuthApi.register(payload);
    storeSession(res?.data?.client, res?.data?.accessToken);
    return res?.data?.client;
  }, [storeSession]);

  // Used both on page load and by the axios 401 retry to get a new access token.
  const refreshSession = useCallback(async () => {
    const res = await clientAuthApi.refresh();
    const nextToken = res?.data?.accessToken;
    storeSession(res?.data?.client, nextToken);
    return nextToken;
  }, [storeSession]);

  const logout = useCallback(async () => {
    try {
      await clientAuthApi.logout();
    } catch {
      /* ignore network errors on logout */
    }
    clearSession();
  }, [clearSession]);

  // Let clientAxios call refreshSession when it hits a 401.
  useEffect(() => {
    setClientRefreshHandler(refreshSession);
    return () => setClientRefreshHandler(null);
  }, [refreshSession]);

  // If the axios layer gives up on refreshing, wipe the session.
  useEffect(() => {
    const handler = () => clearSession();
    window.addEventListener("sureboy:client-auth-invalid", handler);
    return () => window.removeEventListener("sureboy:client-auth-invalid", handler);
  }, [clearSession]);

  // On first mount, try to restore an existing session from the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refreshSession();
      } catch {
        clearSession(); // no valid cookie → just stay logged out
      } finally {
        if (active) setIsCheckingSession(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshSession, clearSession]);

  const value = useMemo(
    () => ({
      client,
      accessToken,
      isAuthenticated,
      isCheckingSession,
      login,
      register,
      logout,
      refreshSession,
      setClient, // lets pages (e.g. profile edit) update the cached profile
    }),
    [client, accessToken, isAuthenticated, isCheckingSession, login, register, logout, refreshSession],
  );

  return <ClientAuthContext.Provider value={value}>{children}</ClientAuthContext.Provider>;
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error("useClientAuth must be used inside ClientAuthProvider.");
  }
  return context;
}
