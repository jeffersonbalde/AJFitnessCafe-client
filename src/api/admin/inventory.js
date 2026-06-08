import { api } from "../../lib/api";

export function fetchInventoryVariants(params = {}) {
  return api.get("/admin/inventory/variants", { params });
}

export function fetchInventoryAlerts() {
  return api.get("/admin/inventory/alerts");
}

export function adjustInventory(payload) {
  return api.post("/admin/inventory/adjust", payload);
}

export function stocktakeInventory(payload) {
  return api.post("/admin/inventory/stocktake", payload);
}

export function receiveInventory(payload) {
  return api.post("/admin/inventory/receive", payload);
}

export function expireInventoryReservations() {
  return api.post("/admin/inventory/expire-reservations");
}

