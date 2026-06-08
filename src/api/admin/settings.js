import { api } from "../../lib/api";

export function fetchAdminSettings() {
  return api.get("/admin/settings");
}

export function patchAdminSettings(payload) {
  return api.patch("/admin/settings", payload);
}

