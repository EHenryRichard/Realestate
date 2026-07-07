// Client dashboard data: saved properties, recently viewed, and inquiries.
// Uses the same authenticated clientAxios instance as the auth calls, so the
// access token + refresh-on-401 behaviour come for free.
import { clientAxios } from "./clientAxios.js";

export const clientApi = {
  // Saved properties
  listSaved: () => clientAxios.get("/client/saved"),
  saveProperty: (propertyId) => clientAxios.post(`/client/saved/${propertyId}`),
  unsaveProperty: (propertyId) => clientAxios.delete(`/client/saved/${propertyId}`),

  // Recently viewed
  listViewed: () => clientAxios.get("/client/views"),
  recordView: (propertyId) => clientAxios.post(`/client/views/${propertyId}`),

  // Inquiries (contact an agent)
  listInquiries: () => clientAxios.get("/client/inquiries"),
  createInquiry: (payload) => clientAxios.post("/client/inquiries", payload),
};
