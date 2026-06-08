import { api } from "../../lib/api";

export function fetchProducts(params = {}) {
  return api.get("/admin/products", { params });
}

export function fetchProduct(id) {
  return api.get(`/admin/products/${id}`);
}

export function createProduct(payload) {
  return api.post("/admin/products", payload);
}

export function updateProduct(id, payload) {
  return api.put(`/admin/products/${id}`, payload);
}

export function deleteProduct(id) {
  return api.delete(`/admin/products/${id}`);
}
