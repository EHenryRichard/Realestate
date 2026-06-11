export const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
  useApi: import.meta.env.VITE_USE_API !== "false",
  endpoints: {
    properties: "/properties",
    featuredProperties: "/properties/featured",
    services: "/services",
    testimonials: "/testimonials",
    contact: "/contact",
    newsletter: "/newsletter",
  },
};
