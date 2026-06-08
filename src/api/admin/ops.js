import { api } from "../../lib/api";

export function fetchAdminOpsBoard(params = {}) {
  return api.get("/admin/ops/board", { params });
}

export function patchAdminDispatch(orderId, payload) {
  return api.patch(`/admin/ops/orders/${encodeURIComponent(orderId)}/dispatch`, payload);
}

