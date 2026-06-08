import { api } from "../../lib/api";

/**
 * @param {object} [opts]
 * @param {number} [opts.page]
 * @param {number} [opts.per_page]
 * @param {string} [opts.q]
 * @param {string} [opts.tag]
 * @param {string} [opts.segment]
 * @param {'all'|'active'|'suspended'} [opts.suspended]
 * @param {'all'|'yes'|'no'} [opts.has_orders]
 * @param {string} [opts.last_order_from] YYYY-MM-DD
 * @param {string} [opts.last_order_to] YYYY-MM-DD
 */
export function fetchAdminCustomers(opts = {}) {
  const {
    page = 1,
    per_page: perPage,
    q,
    tag,
    segment,
    suspended,
    has_orders: hasOrders,
    last_order_from: lastOrderFrom,
    last_order_to: lastOrderTo,
  } = opts;
  const params = { page };
  if (perPage != null) params.per_page = perPage;
  if (q) params.q = q;
  if (tag) params.tag = tag;
  if (segment) params.segment = segment;
  if (suspended && suspended !== "all") params.suspended = suspended;
  if (hasOrders && hasOrders !== "all") params.has_orders = hasOrders;
  if (lastOrderFrom) params.last_order_from = lastOrderFrom;
  if (lastOrderTo) params.last_order_to = lastOrderTo;
  return api.get("/admin/customers", { params });
}

/**
 * @param {object} [opts]
 * @param {Record<string, string>} [opts.params] extra query (legacy)
 */
export function exportAdminCustomersCsv(opts = {}) {
  const {
    q,
    tag,
    segment,
    suspended,
    has_orders: hasOrders,
    last_order_from: lastOrderFrom,
    last_order_to: lastOrderTo,
  } = opts;
  const params = {};
  if (q) params.q = q;
  if (tag) params.tag = tag;
  if (segment) params.segment = segment;
  if (suspended && suspended !== "all") params.suspended = suspended;
  if (hasOrders && hasOrders !== "all") params.has_orders = hasOrders;
  if (lastOrderFrom) params.last_order_from = lastOrderFrom;
  if (lastOrderTo) params.last_order_to = lastOrderTo;
  return api.get("/admin/customers/export", { params, responseType: "blob" });
}

/**
 * @param {number|string} id
 * @param {object} [opts]
 * @param {number} [opts.page] orders list page
 * @param {number} [opts.per_page]
 */
export function fetchAdminCustomer(id, opts = {}) {
  const { page = 1, per_page: perPage } = opts;
  const params = { page };
  if (perPage != null) params.per_page = perPage;
  return api.get(`/admin/customers/${encodeURIComponent(id)}`, { params });
}

/**
 * @param {number|string} id
 * @param {object} payload
 */
export function patchAdminCustomer(id, payload) {
  return api.patch(`/admin/customers/${encodeURIComponent(id)}`, payload);
}

export function postAdminCustomerPasswordReset(id) {
  return api.post(
    `/admin/customers/${encodeURIComponent(id)}/send-password-reset`,
  );
}

/** @param {{ password: string, password_confirmation: string }} body */
export function postAdminCustomerTempPassword(id, body) {
  return api.post(
    `/admin/customers/${encodeURIComponent(id)}/set-temp-password`,
    body,
  );
}
