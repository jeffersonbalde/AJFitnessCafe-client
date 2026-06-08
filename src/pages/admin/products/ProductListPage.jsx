import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteProduct, fetchProducts } from "../../../api/admin/products";
import { showToast } from "../../../services/notificationService";
import AdminPageShell from "../AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "../adminPageTheme";

export default function ProductListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchProducts();
      const rows = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      showToast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this product and all its variants?")) return;
    try {
      await deleteProduct(id);
      showToast.success("Product deleted.");
      await load();
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Delete failed.");
    }
  }

  function minPrice(variants) {
    if (!variants?.length) return "—";
    const nums = variants
      .filter((v) => v.is_active !== false)
      .map((v) => Number(v.price));
    if (!nums.length) return "—";
    return `₱${Math.min(...nums).toFixed(2)}`;
  }

  const headerActions = (
    <Link
      to="/admin/products/new"
      className="btn btn-sm btn-primary"
      style={{
        borderRadius: 6,
        fontFamily: T.interFamily,
        fontWeight: 500,
        fontSize: "0.8rem",
      }}
    >
      <i className="fas fa-plus me-1" aria-hidden />
      Add product
    </Link>
  );

  return (
    <AdminPageShell
      iconClassName="fas fa-box-open"
      title="Products"
      subtitle="Manage catalog items, pricing variants, and availability."
      headerActions={headerActions}
    >
      <div
        className="rounded-3 overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          border: T.cardBorder,
        }}
      >
        <div
          className="px-3 py-2"
          style={{
            backgroundColor: T.toolbarBg,
            borderBottom: "1px solid #e5e7eb",
            fontFamily: T.interFamily,
            fontWeight: 700,
            fontSize: "0.85rem",
            color: T.titleColor,
          }}
        >
          Product catalog
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 72, fontFamily: T.interFamily }} />
                <th style={{ fontFamily: T.interFamily }}>Name</th>
                <th style={{ fontFamily: T.interFamily }}>Category</th>
                <th style={{ fontFamily: T.interFamily }}>From</th>
                <th style={{ fontFamily: T.interFamily }}>Active</th>
                <th
                  className="text-end"
                  style={{ fontFamily: T.interFamily }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted py-4 text-center"
                    style={{ fontFamily: T.interFamily }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted py-4 text-center"
                    style={{ fontFamily: T.interFamily }}
                  >
                    No products yet.{" "}
                    <Link to="/admin/products/new">Create one</Link>.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.image_url ? (
                        <img
                          src={row.image_url}
                          alt=""
                          className="rounded border"
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="border rounded d-flex align-items-center justify-content-center small text-muted"
                          style={{
                            width: 48,
                            height: 48,
                            backgroundColor: T.emptyIconBg,
                          }}
                        >
                          —
                        </div>
                      )}
                    </td>
                    <td
                      className="fw-semibold"
                      style={{ fontFamily: T.interFamily }}
                    >
                      {row.name}
                    </td>
                    <td style={{ fontFamily: T.interFamily }}>
                      {row.category?.name ?? "—"}
                    </td>
                    <td style={{ fontFamily: T.interFamily }}>
                      {minPrice(row.variants)}
                    </td>
                    <td style={{ fontFamily: T.interFamily }}>
                      {row.is_active ? "Yes" : "No"}
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/admin/products/${row.id}/edit`}
                        className="btn btn-link btn-sm py-0"
                        style={{
                          fontFamily: T.interFamily,
                          fontSize: "0.8rem",
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn btn-link btn-sm py-0 text-danger"
                        style={{
                          fontFamily: T.interFamily,
                          fontSize: "0.8rem",
                        }}
                        onClick={() => handleDelete(row.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
