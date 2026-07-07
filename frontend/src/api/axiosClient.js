import axios from "axios";
import { adminApiPath, adminConfig, adminPath, isAdminBrowserPath } from "../config/adminConfig.js";
import { apiConfig } from "../config/apiConfig.js";

let adminAuthToken = "";
let adminAuthRefreshHandler = null;

const isAdminRequest = (config = {}) => {
  const url = config.url || "";
  const baseURL = config.baseURL || "";
  const hiddenAdminApiPath = adminConfig.apiBasePath;
  const fullHiddenAdminApiPath = `${apiConfig.baseURL}${hiddenAdminApiPath}`;

  return (
    url.startsWith("/admin") ||
    url.startsWith(hiddenAdminApiPath) ||
    `${baseURL}${url}`.includes(fullHiddenAdminApiPath)
  );
};

const isAdminAuthRefreshRequest = (config = {}) => {
  const url = config.url || "";

  return url.includes("/admin/auth/refresh") || url.includes(`${adminConfig.apiBasePath}/auth/refresh`);
};

const isSkippedAdminAuthRequest = (config = {}) => {
  const url = config.url || "";

  return [
    "/admin/auth/login",
    "/admin/auth/signup",
    "/admin/auth/refresh",
    "/admin/auth/logout",
    "/admin/auth/forgot-password",
    "/admin/auth/reset-password",
    `${adminConfig.apiBasePath}/auth/login`,
    `${adminConfig.apiBasePath}/auth/signup`,
    `${adminConfig.apiBasePath}/auth/refresh`,
    `${adminConfig.apiBasePath}/auth/logout`,
    `${adminConfig.apiBasePath}/auth/forgot-password`,
    `${adminConfig.apiBasePath}/auth/reset-password`,
  ].some((path) => url.includes(path));
};

const rewriteAdminApiUrl = (url = "") => {
  if (typeof url !== "string" || !url.startsWith("/admin")) {
    return url;
  }

  return adminApiPath(url);
};

export const setAdminAuthToken = (token = "") => {
  adminAuthToken = token;
};

export const setAdminAuthRefreshHandler = (handler = null) => {
  adminAuthRefreshHandler = handler;
};

export const getAdminAuthToken = () => adminAuthToken;

export const clearAdminAuthToken = () => {
  adminAuthToken = "";
};

export const axiosClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  config.url = rewriteAdminApiUrl(config.url);

  if (adminAuthToken) {
    config.headers = config.headers || {};

    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${adminAuthToken}`);
    } else {
      config.headers.Authorization = `Bearer ${adminAuthToken}`;
    }
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const status = error?.response?.status;
    const requestConfig = error?.config || {};

    if (
      status === 401 &&
      isAdminRequest(requestConfig) &&
      !isSkippedAdminAuthRequest(requestConfig) &&
      !requestConfig.__sureboyRetry &&
      adminAuthRefreshHandler
    ) {
      try {
        const nextAccessToken = await adminAuthRefreshHandler();
        requestConfig.__sureboyRetry = true;
        requestConfig.headers = requestConfig.headers || {};

        if (typeof requestConfig.headers.set === "function") {
          requestConfig.headers.set("Authorization", `Bearer ${nextAccessToken}`);
        } else {
          requestConfig.headers.Authorization = `Bearer ${nextAccessToken}`;
        }

        return axiosClient(requestConfig);
      } catch {
        clearAdminAuthToken();
        window.dispatchEvent(new CustomEvent("sureboy:admin-auth-invalid"));

        if (isAdminBrowserPath() && window.location.pathname !== adminPath("login")) {
          window.location.assign(adminPath("login"));
        }
      }
    }

    if ([401, 404].includes(status) && isAdminRequest(requestConfig)) {
      clearAdminAuthToken();
      window.dispatchEvent(new CustomEvent("sureboy:admin-auth-invalid"));

      if (isAdminBrowserPath() && window.location.pathname !== adminPath("login")) {
        window.location.assign(adminPath("login"));
      }
    }

    const message = error?.response?.data?.message || error.message || "Something went wrong.";
    return Promise.reject(new Error(message));
  },
);
