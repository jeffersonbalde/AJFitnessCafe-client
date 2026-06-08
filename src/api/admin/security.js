import { api } from "../../lib/api";

export function fetchAdminSessions() {
  return api.get("/admin/security/sessions");
}

export function revokeOtherAdminSessions() {
  return api.post("/admin/security/sessions/revoke-others");
}

export function revokeAdminSession(tokenId) {
  return api.delete(`/admin/security/sessions/${encodeURIComponent(tokenId)}`);
}

