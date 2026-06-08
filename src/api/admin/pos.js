import { api } from "../../lib/api";

/**
 * @param {object} payload
 * @param {string} [payload.pos_terminal_label]
 * @param {string} payload.customer_name
 * @param {string} [payload.customer_phone]
 * @param {string} [payload.customer_email]
 * @param {"pickup"|"delivery"} payload.fulfillment_type
 * @param {string} [payload.delivery_address]
 * @param {string} [payload.notes]
 * @param {{ variant_id: number, quantity: number }[]} payload.items
 */
export function createPosOrder(payload) {
  return api.post("/admin/pos/orders", payload);
}

export function fetchPosOrder(id) {
  return api.get(`/admin/pos/orders/${encodeURIComponent(id)}`);
}

/**
 * @param {number|string} id
 * @param {{ payment_method: "manual_card"|"manual_qr"|"cash", payment_reference?: string|null }} payload
 */
export function markPosOrderPaid(id, payload) {
  return api.post(
    `/admin/pos/orders/${encodeURIComponent(id)}/mark-paid`,
    payload,
  );
}

