import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchCatalogCategories,
  fetchCatalogProducts,
} from "../../api/catalog";

function minPrice(variants) {
  if (!variants?.length) return null;
  const nums = variants
    .filter((v) => v.is_active !== false)
    .map((v) => Number(v.price));
  if (!nums.length) return null;
  return Math.min(...nums);
}

export default function StoreMenuSection() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cRes, pRes] = await Promise.all([
          fetchCatalogCategories(),
          fetchCatalogProducts(
            categoryId ? { category_id: categoryId } : {},
          ),
        ]);
        if (cancelled) return;
        setCategories(cRes.data?.data ?? cRes.data ?? []);
        setProducts(pRes.data?.data ?? pRes.data ?? []);
      } catch {
        if (!cancelled) setError("Could not load the menu. Try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const categoryOptions = useMemo(
    () =>
      Array.isArray(categories)
        ? categories.filter((c) => c.is_active !== false)
        : [],
    [categories],
  );

  return (
    <section id="store-menu" className="store-menu-section pt-2">
      <div className="mb-4">
        <h2
          className="store-menu-title mb-1"
          style={{ color: "var(--primary-dark)" }}
        >
          Menu
        </h2>
        <p className="text-muted mb-0 small">
          Tap a product to choose size and add to cart.
        </p>
      </div>

      <div className="mb-4 d-flex flex-wrap gap-2 align-items-center">
        <label className="small text-muted mb-0 me-1" htmlFor="store-menu-category">
          Category
        </label>
        <select
          id="store-menu-category"
          className="form-select form-select-sm w-auto"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted py-5 text-center">Loading menu…</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : (
        <div className="row g-4">
          {products.map((p) => {
            const from = minPrice(p.variants);
            return (
              <div key={p.id} className="col-sm-6 col-lg-4">
                <Link
                  to={`/product/${encodeURIComponent(p.slug)}`}
                  className="text-decoration-none text-dark"
                >
                  <div className="card h-100 border-0 shadow-sm storefront-product-card">
                    <div className="ratio ratio-4x3 bg-light border-bottom">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="object-fit-cover rounded-top"
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center text-muted small">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      <h3 className="h6 card-title mb-1">{p.name}</h3>
                      <p className="small text-muted text-truncate mb-2">
                        {p.description || " "}
                      </p>
                      <span className="fw-semibold text-brand">
                        {from != null ? `From ₱${from.toFixed(2)}` : "See options"}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && products.length === 0 ? (
        <p className="text-muted py-4">No products in this category yet.</p>
      ) : null}
    </section>
  );
}
