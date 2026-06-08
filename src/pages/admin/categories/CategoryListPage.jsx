import { useCallback, useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../../../api/admin/categories";
import { showToast } from "../../../services/notificationService";
import AdminPageShell from "../AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "../adminPageTheme";

export default function CategoryListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCategories();
      const rows = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      showToast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(row) {
    setEditingId(row.id);
    setName(row.name);
    setSortOrder(row.sort_order ?? 0);
    setIsActive(Boolean(row.is_active));
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setSortOrder(0);
    setIsActive(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      showToast.error("Name is required.");
      return;
    }
    try {
      if (editingId) {
        await updateCategory(editingId, {
          name: name.trim(),
          sort_order: Number(sortOrder) || 0,
          is_active: isActive,
        });
        showToast.success("Category updated.");
      } else {
        await createCategory({
          name: name.trim(),
          sort_order: Number(sortOrder) || 0,
          is_active: isActive,
        });
        showToast.success("Category created.");
      }
      cancelEdit();
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.name?.[0] ||
        "Save failed.";
      showToast.error(msg);
    }
  }

  async function handleDelete(id) {
    if (
      !window.confirm(
        "Delete this category? Products may lose their category.",
      )
    ) {
      return;
    }
    try {
      await deleteCategory(id);
      showToast.success("Category deleted.");
      await load();
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Delete failed.");
    }
  }

  const primaryBtn = {
    borderRadius: 6,
    fontFamily: T.interFamily,
    fontWeight: 500,
    fontSize: "0.8rem",
  };

  return (
    <AdminPageShell
      iconClassName="fas fa-folder-open"
      title="Categories"
      subtitle="Create and organize product categories for your catalog."
    >
      <div
        className="rounded-3 p-3 mb-4"
        style={{
          backgroundColor: "#ffffff",
          border: T.cardBorder,
        }}
      >
        <div
          className="px-2 py-2 mb-3 rounded-2"
          style={{
            backgroundColor: T.summaryStripBg,
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
            {editingId ? "Edit category" : "Add category"}
          </span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="row g-2 align-items-end">
            <div className="col-md-5">
              <label
                className="form-label small mb-1"
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
            <div className="col-md-2">
              <label
                className="form-label small mb-1"
                style={{ fontFamily: T.interFamily }}
              >
                Sort
              </label>
              <input
                type="number"
                min={0}
                className="form-control form-control-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <div className="col-md-2 form-check mt-3 pt-1">
              <input
                id="cat-active"
                type="checkbox"
                className="form-check-input"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label
                className="form-check-label small"
                htmlFor="cat-active"
                style={{ fontFamily: T.interFamily }}
              >
                Active
              </label>
            </div>
            <div className="col-md-3 d-flex gap-2 flex-wrap">
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                style={primaryBtn}
              >
                {editingId ? "Save" : "Add"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  style={primaryBtn}
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

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
          All categories
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ fontFamily: T.interFamily }}>Name</th>
                <th style={{ fontFamily: T.interFamily }}>Slug</th>
                <th style={{ fontFamily: T.interFamily }}>Sort</th>
                <th style={{ fontFamily: T.interFamily }}>Active</th>
                <th className="text-end" style={{ fontFamily: T.interFamily }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted py-4 text-center"
                    style={{ fontFamily: T.interFamily }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted py-4 text-center"
                    style={{ fontFamily: T.interFamily }}
                  >
                    No categories yet.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td
                      className="fw-semibold"
                      style={{ fontFamily: T.interFamily }}
                    >
                      {row.name}
                    </td>
                    <td>
                      <code className="small">{row.slug}</code>
                    </td>
                    <td style={{ fontFamily: T.interFamily }}>
                      {row.sort_order}
                    </td>
                    <td style={{ fontFamily: T.interFamily }}>
                      {row.is_active ? "Yes" : "No"}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-link btn-sm py-0"
                        style={{
                          fontFamily: T.interFamily,
                          fontSize: "0.8rem",
                        }}
                        onClick={() => startEdit(row)}
                      >
                        Edit
                      </button>
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
