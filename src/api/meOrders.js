import { api } from "../lib/api";

export function fetchMyOrders(page = 1, perPage = 15) {
  return api.get("/me/orders", { params: { page, per_page: perPage } });
}

export function fetchMyOrder(orderNumber) {
  return api.get(`/me/orders/${encodeURIComponent(orderNumber)}`);
}
