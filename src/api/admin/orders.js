import { api } from "../../lib/api";

/**
 * @param {object} [opts]
 * @param {number} [opts.page]
 * @param {number} [opts.per_page]
 * @param {string} [opts.status] filter by order status (omit or empty for all)
 * @param {string} [opts.q] text search on reference/customer/contact
 * @param {string} [opts.payment_method]
 * @param {string} [opts.maya_payment_status]
 * @param {string} [opts.fulfillment_type] pickup|delivery
 * @param {string} [opts.date_from] YYYY-MM-DD
 * @param {string} [opts.date_to] YYYY-MM-DD
 * @param {number} [opts.user_id] registered customer account id
 */
export function fetchAdminOrders(opts = {}) {
  const {
    page = 1,
    per_page: perPage,
    status,
    q,
    payment_method: paymentMethod,
    maya_payment_status: mayaPaymentStatus,
    fulfillment_type: fulfillmentType,
    date_from: dateFrom,
    date_to: dateTo,
    user_id: userId,
  } = opts;
  const params = { page };
  if (perPage != null) params.per_page = perPage;
  if (status !== undefined && status !== null && String(status).trim() !== "") {
    params.status = String(status).trim();
  }
  if (q) params.q = q;
  if (paymentMethod) params.payment_method = paymentMethod;
  if (mayaPaymentStatus) params.maya_payment_status = mayaPaymentStatus;
  if (fulfillmentType) params.fulfillment_type = fulfillmentType;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (userId != null && userId !== "") params.user_id = userId;
  return api.get("/admin/orders", { params });
}

export function fetchAdminOrder(id) {
  return api.get(`/admin/orders/${encodeURIComponent(id)}`);
}

/** @param {{ status?: string, admin_note?: string|null }} payload */
export function patchAdminOrder(id, payload) {
  return api.patch(`/admin/orders/${encodeURIComponent(id)}`, payload);
}

export function reconcileAdminOrderPayment(id) {
  return api.post(`/admin/orders/${encodeURIComponent(id)}/reconcile-payment`);
}

/**
 * Link a guest order (no user_id) to a registered customer.
 * @param {number|string} orderId
 * @param {{ user_id: number, confirm_email_mismatch?: boolean }} body
 */
export function postAssignOrderCustomer(orderId, body) {
  return api.post(
    `/admin/orders/${encodeURIComponent(orderId)}/assign-customer`,
    body,
  );
}

export function exportAdminOrdersCsv(opts = {}) {
  const {
    status,
    q,
    payment_method: paymentMethod,
    maya_payment_status: mayaPaymentStatus,
    fulfillment_type: fulfillmentType,
    date_from: dateFrom,
    date_to: dateTo,
    user_id: userId,
  } = opts;
  const params = {};
  if (status) params.status = status;
  if (q) params.q = q;
  if (paymentMethod) params.payment_method = paymentMethod;
  if (mayaPaymentStatus) params.maya_payment_status = mayaPaymentStatus;
  if (fulfillmentType) params.fulfillment_type = fulfillmentType;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (userId != null && userId !== "") params.user_id = userId;
  return api.get("/admin/orders/export", { params, responseType: "blob" });
}
