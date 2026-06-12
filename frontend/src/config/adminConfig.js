const normalizePath = (value, fallback) => {
  const source = typeof value === "string" && value.trim() ? value.trim() : fallback;
  const path = source.replace(/^\/+|\/+$/g, "");

  return path ? `/${path}` : fallback;
};

const stripLegacyAdminPrefix = (path = "") => path.replace(/^\/admin\/?/, "");

export const adminConfig = {
  basePath: normalizePath(import.meta.env.VITE_ADMIN_BASE_PATH, "/control-panel"),
  apiBasePath: normalizePath(import.meta.env.VITE_ADMIN_API_BASE_PATH, "/core-portal"),
};

export const adminPath = (path = "") => {
  const suffix = stripLegacyAdminPrefix(path).replace(/^\/+/, "");

  return suffix ? `${adminConfig.basePath}/${suffix}` : adminConfig.basePath;
};

export const adminApiPath = (path = "") => {
  const suffix = stripLegacyAdminPrefix(path).replace(/^\/+/, "");

  return suffix ? `${adminConfig.apiBasePath}/${suffix}` : adminConfig.apiBasePath;
};

export const isAdminBrowserPath = (pathname = window.location.pathname) =>
  pathname === adminConfig.basePath || pathname.startsWith(`${adminConfig.basePath}/`);
