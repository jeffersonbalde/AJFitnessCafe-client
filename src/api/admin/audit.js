import { api } from "../../lib/api";

export function fetchAdminAuditLogs(params = {}) {
  return api.get("/admin/audit-logs", { params });
}

