import { api } from "../../lib/api";

export function fetchAdminPaymentAlerts() {
  return api.get("/admin/payments/alerts");
}

export function postAdminRefund(orderId, payload) {
  return api.post(`/admin/orders/${encodeURIComponent(orderId)}/refund`, payload);
}

