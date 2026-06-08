import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchCategories } from "../../../api/admin/categories";
import {
  createProduct,
  fetchProduct,
  updateProduct,
} from "../../../api/admin/products";
import { showToast } from "../../../services/notificationService";
import AdminPageShell from "../AdminPageShell";
import AdminPageLoading from "../AdminPageLoading";
import { ADMIN_PAGE_THEME as T } from "../adminPageTheme";

const emptyVariant = () => ({
  id: undefined,
  label: "",
  price: "",
  sku: "",
  is_active: true,
  track_stock: false,
  stock_on_hand: 0,
  low_stock_threshold: 5,
});

const btnSm = {
  borderRadius: 6,
  fontFamily: T.interFamily,
  fontWeight: 500,
  fontSize: "0.8rem",
};

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [variants, setVariants] = useState([emptyVariant()]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchCategories();
        const rows = res.data?.data ?? res.data ?? [];
        if (!cancelled) setCategories(Array.isArray(rows) ? rows : []);
      } catch {
        showToast.error("Failed to load categories.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchProduct(id);
        const row = res.data?.data ?? res.data;
        if (cancelled || !row) return;
        setName(row.name ?? "");
        setDescription(row.description ?? "");
        setCategoryId(row.category_id ? String(row.category_id) : "");
        setSortOrder(row.sort_order ?? 0);
        setIsActive(Boolean(row.is_active));
        if (row.variants?.length) {
          setVariants(
            row.variants.map((v) => ({
              id: v.id,
              label: v.label ?? "",
              price: String(v.price ?? ""),
              sku: v.sku ?? "",
              is_active: v.is_active !== false,
              track_stock: Boolean(v.track_stock),
              stock_on_hand: Number(v.stock_on_hand ?? 0),
              low_stock_threshold: Number(v.low_stock_threshold ?? 5),
            })),
          );
        } else {
          setVariants([emptyVariant()]);
        }
      } catch {
        showToast.error("Failed to load product.");
        navigate("/admin/products", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, navigate]);

  function setVariant(i, field, value) {
    setVariants((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariant(i) {
    setVariants((prev) => prev.filter((_, j) => j !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const parsedVariants = variants.map((v, idx) => ({
      ...(v.id ? { id: v.id } : {}),
      label: v.label.trim(),
      price: Number(v.price),
      sku: v.sku?.trim() || null,
      sort_order: idx,
      is_active: v.is_active,
      track_stock: Boolean(v.track_stock),
      stock_on_hand: Number(v.stock_on_hand || 0),
      low_stock_threshold: Number(v.low_stock_threshold || 0),
    }));

    const invalid = parsedVariants.some((v) => {
      if (!v.label || Number.isNaN(v.price) || v.price < 0) return true;
      if (Number.isNaN(v.stock_on_hand) || v.stock_on_hand < 0) return true;
      if (Number.isNaN(v.low_stock_threshold) || v.low_stock_threshold < 0) return true;
      return false;
    });
    if (invalid || parsedVariants.length === 0) {
      showToast.error("Each variant needs valid label, price, and stock fields.");
      return;
    }

    setSaving(true);
    try {
      const payloadBase = {
        name: name.trim(),
        description: description.trim() || null,
        category_id: categoryId ? Number(categoryId) : null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
        variants: parsedVariants,
      };

      const useMultipart = Boolean(imageFile);

      if (isNew) {
        if (useMultipart) {
          const fd = new FormData();
          fd.append("name", payloadBase.name);
          if (payloadBase.description) {
            fd.append("description", payloadBase.description);
          }
          if (payloadBase.category_id) {
            fd.append("category_id", String(payloadBase.category_id));
          }
          fd.append("sort_order", String(payloadBase.sort_order));
          fd.append("is_active", payloadBase.is_active ? "1" : "0");
          fd.append("variants", JSON.stringify(parsedVariants));
          if (imageFile) fd.append("image", imageFile);
          await createProduct(fd);
        } else {
          await createProduct(payloadBase);
        }
        showToast.success("Product created.");
      } else if (useMultipart) {
        const fd = new FormData();
        fd.append("name", payloadBase.name);
        if (payloadBase.description) {
          fd.append("description", payloadBase.description);
        }
        if (payloadBase.category_id) {
          fd.append("category_id", String(payloadBase.category_id));
        }
        fd.append("sort_order", String(payloadBase.sort_order));
        fd.append("is_active", payloadBase.is_active ? "1" : "0");
        fd.append("variants", JSON.stringify(parsedVariants));
        if (imageFile) fd.append("image", imageFile);
        await updateProduct(id, fd);
        showToast.success("Product updated.");
      } else {
        await updateProduct(id, payloadBase);
        showToast.success("Product updated.");
      }
      navigate("/admin/products", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        Object.values(err?.response?.data?.errors || {})
          .flat()
          .join(" ") ||
        "Save failed.";
      showToast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminPageLoading
        iconClassName="fas fa-box-open"
        title={isNew ? "New product" : "Edit product"}
        subtitle="Loading product details…"
        message="Loading… Please wait."
      />
    );
  }

  return (
    <div className="page-enter">
    <AdminPageShell
      iconClassName={isNew ? "fas fa-plus" : "fas fa-edit"}
      title={isNew ? "New product" : "Edit product"}
      subtitle={
        isNew
          ? "Add a catalog item, image, and one or more price variants."
          : "Update details and variants for this product."
      }
    >
      <div className="mb-3">
        <Link
          to="/admin/products"
          className="text-decoration-none text-muted"
          style={{ fontFamily: T.interFamily, fontSize: "0.85rem" }}
        >
          <i className="fas fa-arrow-left me-1" aria-hidden />
          Back to products
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3 p-4"
        style={{
          backgroundColor: "#ffffff",
          border: T.cardBorder,
        }}
      >
        <div className="row g-3">
          <div className="col-md-8">
            <label
              className="form-label small"
              style={{ fontFamily: T.interFamily }}
            >
              Name
            </label>
            <input
              className="form-control form-control-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <label
              className="form-label small"
              style={{ fontFamily: T.interFamily }}
            >
              Category
            </label>
            <select
              className="form-select form-select-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label
              className="form-label small"
              style={{ fontFamily: T.interFamily }}
            >
              Description
            </label>
            <textarea
              className="form-control form-control-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label
              className="form-label small"
              style={{ fontFamily: T.interFamily }}
            >
              Sort order
            </label>
            <input
              type="number"
              min={0}
              className="form-control form-control-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <div className="form-check">
              <input
                id="p-active"
                type="checkbox"
                className="form-check-input"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label
                className="form-check-label small"
                htmlFor="p-active"
                style={{ fontFamily: T.interFamily }}
              >
                Active
              </label>
            </div>
          </div>
          <div className="col-md-8">
            <label
              className="form-label small"
              style={{ fontFamily: T.interFamily }}
            >
              Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              className="form-control form-control-sm"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <hr className="my-4" />

        <div
          className="rounded-3 overflow-hidden mb-3"
          style={{ border: T.cardBorder }}
        >
          <div
            className="px-3 py-2 d-flex align-items-center justify-content-between flex-wrap gap-2"
            style={{
              backgroundColor: T.toolbarBg,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <span
              style={{
                fontFamily: T.interFamily,
                fontWeight: 700,
                fontSize: "0.85rem",
                color: T.titleColor,
              }}
            >
              Variants &amp; prices
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              style={btnSm}
              onClick={addVariant}
            >
              <i className="fas fa-plus me-1" aria-hidden />
              Add variant
            </button>
          </div>
          <div className="table-responsive p-2 p-md-3">
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ fontFamily: T.interFamily }}>Label</th>
                  <th style={{ width: 140, fontFamily: T.interFamily }}>
                    Price (₱)
                  </th>
                  <th style={{ fontFamily: T.interFamily }}>SKU</th>
                  <th style={{ fontFamily: T.interFamily }}>Track stock</th>
                  <th style={{ width: 120, fontFamily: T.interFamily }}>On hand</th>
                  <th style={{ width: 140, fontFamily: T.interFamily }}>Low stock at</th>
                  <th style={{ fontFamily: T.interFamily }}>Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.id ?? `new-${i}`}>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={v.label}
                        onChange={(e) =>
                          setVariant(i, "label", e.target.value)
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="form-control form-control-sm"
                        value={v.price}
                        onChange={(e) =>
                          setVariant(i, "price", e.target.value)
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={v.sku}
                        onChange={(e) => setVariant(i, "sku", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={v.track_stock}
                        onChange={(e) =>
                          setVariant(i, "track_stock", e.target.checked)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        className="form-control form-control-sm"
                        value={v.stock_on_hand}
                        onChange={(e) =>
                          setVariant(i, "stock_on_hand", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        className="form-control form-control-sm"
                        value={v.low_stock_threshold}
                        onChange={(e) =>
                          setVariant(i, "low_stock_threshold", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={v.is_active}
                        onChange={(e) =>
                          setVariant(i, "is_active", e.target.checked)
                        }
                      />
                    </td>
                    <td>
                      {variants.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-danger py-0"
                          style={{
                            fontFamily: T.interFamily,
                            fontSize: "0.8rem",
                          }}
                          onClick={() => removeVariant(i)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button
            type="submit"
            className="btn btn-primary"
            style={btnSm}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save product"}
          </button>
          <Link
            to="/admin/products"
            className="btn btn-outline-secondary"
            style={btnSm}
          >
            Cancel
          </Link>
        </div>
      </form>
    </AdminPageShell>
    </div>
  );
}
