// clientAxios.js
// A dedicated axios instance for the PUBLIC (client) side of the site, kept
// separate from the admin axiosClient so the two sessions never interfere.
// - The access token lives in memory (never localStorage) and is attached as a
//   Bearer header on each request.
// - The refresh token is an httpOnly cookie (withCredentials: true sends it).
// - On a 401 we transparently try to refresh once, then retry the request.
import axios from "axios";
import { apiConfig } from "../config/apiConfig.js";

let clientAuthToken = "";
let clientRefreshHandler = null;

export const setClientAuthToken = (token = "") => {
  clientAuthToken = token;
};
export const getClientAuthToken = () => clientAuthToken;
export const clearClientAuthToken = () => {
  clientAuthToken = "";
};
// The auth context registers a function here that calls /client/auth/refresh.
export const setClientRefreshHandler = (handler = null) => {
  clientRefreshHandler = handler;
};

export const clientAxios = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach the access token (if we have one) to every outgoing request.
clientAxios.interceptors.request.use((config) => {
  if (clientAuthToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${clientAuthToken}`;
  }
  return config;
});

// These endpoints must NOT trigger the refresh-and-retry loop (they're the ones
// that establish or lack a session in the first place).
const AUTH_ENDPOINTS = [
  "/client/auth/login",
  "/client/auth/register",
  "/client/auth/refresh",
  "/client/auth/logout",
  "/client/auth/verify-email",
  "/client/auth/resend-verification",
];

clientAxios.interceptors.response.use(
  // Unwrap so callers get the response body directly ({ success, message, data }).
  (response) => response.data,
  async (error) => {
    const status = error?.response?.status;
    const requestConfig = error?.config || {};
    const url = requestConfig.url || "";
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));

    // On a 401 for a normal request, try to refresh the session once, then retry.
    if (status === 401 && !isAuthEndpoint && !requestConfig.__retry && clientRefreshHandler) {
      try {
        const nextToken = await clientRefreshHandler();
        requestConfig.__retry = true;
        requestConfig.headers = requestConfig.headers || {};
        requestConfig.headers.Authorization = `Bearer ${nextToken}`;
        return clientAxios(requestConfig);
      } catch {
        clearClientAuthToken();
        window.dispatchEvent(new CustomEvent("sureboy:client-auth-invalid"));
      }
    }

    const message = error?.response?.data?.message || error.message || "Something went wrong.";
    return Promise.reject(new Error(message));
  },
);
