import { api } from "../lib/api";

/** Public storefront catalog (no auth). */
export function fetchCatalogCategories() {
  return api.get("/catalog/categories");
}

export function fetchCatalogProducts(params = {}) {
  return api.get("/catalog/products", { params });
}

export function fetchCatalogProductBySlug(slug) {
  return api.get(`/catalog/products/${encodeURIComponent(slug)}`);
}
