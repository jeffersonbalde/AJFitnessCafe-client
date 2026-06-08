import { api } from "../../lib/api";

export function fetchAdminAnalyticsOverview(params = {}) {
  return api.get("/admin/analytics/overview", { params });
}

