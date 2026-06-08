import { api } from "../../lib/api";

export function fetchCategories(params = {}) {
  return api.get("/admin/categories", { params });
}

/**
 * @param {{ name: string, sort_order?: number, is_active?: boolean }} payload
 */
export function createCategory(payload) {
  return api.post("/admin/categories", payload);
}

/**
 * @param {number} id
 * @param {object} payload
 */
export function updateCategory(id, payload) {
  return api.put(`/admin/categories/${id}`, payload);
}

/**
 * @param {number} id
 */
export function deleteCategory(id) {
  return api.delete(`/admin/categories/${id}`);
}
