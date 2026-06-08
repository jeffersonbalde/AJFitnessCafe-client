import { api } from "../lib/api";

/** Guest checkout — totals computed on server. */
export function createOrder(payload) {
  return api.post("/orders", payload);
}

export function fetchOrderByNumber(orderNumber) {
  return api.get(`/orders/${encodeURIComponent(orderNumber)}`);
}
