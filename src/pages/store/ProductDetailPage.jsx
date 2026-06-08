import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchCatalogProductBySlug } from "../../api/catalog";
import { useCart } from "../../contexts/CartContext";
import { showToast } from "../../services/notificationService";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addLine } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchCatalogProductBySlug(slug);
        const p = res.data?.data ?? res.data;
        if (cancelled || !p) return;
        setProduct(p);
        const vars = (p.variants || []).filter((v) => v.is_active !== false);
        setVariantId(vars[0] ? String(vars[0].id) : "");
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const variants = (product?.variants || []).filter(
    (v) => v.is_active !== false,
  );

  function handleAddToCart(e) {
    e.preventDefault();
    if (!product || !variantId) {
      showToast.error("Choose a size.");
      return;
    }
    const v = variants.find((x) => String(x.id) === variantId);
    if (!v) return;
    addLine({
      variantId: v.id,
      quantity: qty,
      productName: product.name,
      variantLabel: v.label,
      unitPrice: Number(v.price),
      slug: product.slug,
      imageUrl: product.image_url,
    });
    showToast.success("Added to cart");
  }

  if (loading) {
    return <p className="text-muted py-5 text-center">Loading…</p>;
  }

  if (!product) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Product not found.</p>
        <Link to="/menu">Back to menu</Link>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-10">
        <Link to="/menu" className="small text-muted text-decoration-none">
          ← Back to menu
        </Link>
        <div className="row g-4 mt-1 align-items-start">
          <div className="col-md-5">
            <div className="ratio ratio-1x1 bg-light rounded-3 overflow-hidden border">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt=""
                  className="object-fit-cover"
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center text-muted">
                  No image
                </div>
              )}
            </div>
          </div>
          <div className="col-md-7">
            <p className="small text-muted mb-1">
              {product.category?.name || "Drinks"}
            </p>
            <h1 className="h3 mb-3" style={{ color: "var(--primary-dark)" }}>
              {product.name}
            </h1>
            {product.description ? (
              <p className="text-muted">{product.description}</p>
            ) : null}

            <form onSubmit={handleAddToCart} className="mt-4">
              <div className="mb-3">
                <label className="form-label small fw-semibold">Size</label>
                <select
                  className="form-select"
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  required
                >
                  {variants.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.label} — ₱{Number(v.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  className="form-control"
                  style={{ maxWidth: 120 }}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 1)}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Add to cart
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
