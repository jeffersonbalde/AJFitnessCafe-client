import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  exportAdminCustomersCsv,
  fetchAdminCustomers,
} from "../../api/admin/customers";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

export default function AdminCustomersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [segment, setSegment] = useState("");
  const [suspended, setSuspended] = useState("all");
  const [hasOrders, setHasOrders] = useState("all");
  const [lastOrderFrom, setLastOrderFrom] = useState("");
  const [lastOrderTo, setLastOrderTo] = useState("");
  const [applied, setApplied] = useState({
    q: "",
    tag: "",
    segment: "",
    suspended: "all",
    has_orders: "all",
    last_order_from: "",
    last_order_to: "",
  });
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminCustomers({
        page,
        per_page: 20,
        q: applied.q || undefined,
        tag: applied.tag || undefined,
        segment: applied.segment || undefined,
        suspended: applied.suspended,
        has_orders: applied.has_orders,
        last_order_from: applied.last_order_from || undefined,
        last_order_to: applied.last_order_to || undefined,
      });
      const body = res.data ?? {};
      const data = Array.isArray(body.data) ? body.data : [];
      setRows(data);
      const m = body.meta;
      setMeta({
        current_page: m?.current_page ?? page,
        last_page: m?.last_page ?? 1,
        per_page: m?.per_page ?? 20,
        total: m?.total ?? data.length,
      });
    } catch {
      showToast.error("Failed to load customers.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilter(e) {
    e.preventDefault();
    setPage(1);
    setApplied({
      q: q.trim(),
      tag: tag.trim(),
      segment: segment.trim(),
      suspended,
      has_orders: hasOrders,
      last_order_from: lastOrderFrom.trim(),
      last_order_to: lastOrderTo.trim(),
    });
  }

  function clearFilters() {
    setQ("");
    setTag("");
    setSegment("");
    setSuspended("all");
    setHasOrders("all");
    setLastOrderFrom("");
    setLastOrderTo("");
    setPage(1);
    setApplied({
      q: "",
      tag: "",
      segment: "",
      suspended: "all",
      has_orders: "all",
      last_order_from: "",
      last_order_to: "",
    });
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const res = await exportAdminCustomersCsv({
        q: applied.q || undefined,
        tag: applied.tag || undefined,
        segment: applied.segment || undefined,
        suspended: applied.suspended,
        has_orders: applied.has_orders,
        last_order_from: applied.last_order_from || undefined,
        last_order_to: applied.last_order_to || undefined,
      });
      const type = res.headers?.["content-type"] || "text/csv";
      const blob = new Blob([res.data], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast.error("Failed to export CSV.");
    } finally {
      setExporting(false);
    }
  }

  const { current_page: curPage, last_page: lastPage, total } = meta;
  const hasPrev = curPage > 1;
  const hasNext = curPage < lastPage;

  function formatTags(list) {
    if (!Array.isArray(list) || list.length === 0) return "—";
    return list.join(", ");
  }

  return (
    <AdminPageShell
      iconClassName="fas fa-users"
      title="Customers"
      subtitle="Registered accounts: segments, tags, suspension, and order stats. Guest-only buyers stay under Orders until linked."
    >
      <form
        onSubmit={applyFilter}
        className="rounded-3 p-3 mb-3"
        style={{ backgroundColor: "#fff", border: T.cardBorder }}
      >
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label small text-muted mb-1">Search</label>
            <input
              className="form-control form-control-sm"
              value={q}
              placeholder="Name, email, phone"
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Tag</label>
            <input
              className="form-control form-control-sm"
              value={tag}
              placeholder="e.g. vip"
              onChange={(e) => setTag(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Group / segment</label>
            <input
              className="form-control form-control-sm"
              value={segment}
              placeholder="e.g. Corporate"
              onChange={(e) => setSegment(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Account</label>
            <select
              className="form-select form-select-sm"
              value={suspended}
              onChange={(e) => setSuspended(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Orders</label>
            <select
              className="form-select form-select-sm"
              value={hasOrders}
              onChange={(e) => setHasOrders(e.target.value)}
            >
              <option value="all">Any</option>
              <option value="yes">Has orders</option>
              <option value="no">No orders</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Last order from</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={lastOrderFrom}
              onChange={(e) => setLastOrderFrom(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Last order to</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={lastOrderTo}
              onChange={(e) => setLastOrderTo(e.target.value)}
            />
          </div>
          <div className="col-12 d-flex flex-wrap gap-2">
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              style={{ backgroundColor: T.primaryGreen, border: "none" }}
            >
              Apply filters
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={clearFilters}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-success"
              disabled={exporting || loading}
              onClick={handleExportCsv}
            >
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-3 overflow-hidden" style={{ border: T.cardBorder }}>
        <div
          className="px-3 py-2 d-flex justify-content-between small"
          style={{ backgroundColor: T.toolbarBg }}
        >
          <span>Accounts</span>
          <span className="text-muted">
            {total} total
            {lastPage > 1 ? ` · Page ${curPage} of ${lastPage}` : ""}
          </span>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Segment</th>
                <th>Tags</th>
                <th className="text-end">Orders</th>
                <th className="text-end">Lifetime</th>
                <th>Last order</th>
                <th>Status</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-muted">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-muted">
                    No customers found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link
                        to={`/admin/customers/${r.id}`}
                        className="fw-semibold text-decoration-none"
                        style={{ color: T.primaryGreen }}
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="small">{r.email}</td>
                    <td className="small">{r.customer_segment || "—"}</td>
                    <td
                      className="small text-muted text-truncate"
                      style={{ maxWidth: "8rem" }}
                      title={formatTags(r.customer_tags)}
                    >
                      {formatTags(r.customer_tags)}
                    </td>
                    <td className="text-end">{r.orders_count ?? 0}</td>
                    <td className="text-end font-monospace small">
                      {r.orders_total_ex_cancelled ?? "0.00"}
                    </td>
                    <td className="small text-muted">
                      {r.last_order_at
                        ? new Date(r.last_order_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="small">
                      {r.is_suspended ? (
                        <span className="badge bg-dark">Suspended</span>
                      ) : (
                        <span className="badge bg-success">Active</span>
                      )}
                    </td>
                    <td className="small">
                      {r.email_verified_at ? (
                        <span className="text-success">Yes</span>
                      ) : (
                        <span className="text-muted">No</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && lastPage > 1 ? (
          <div
            className="d-flex justify-content-between align-items-center px-3 py-2 border-top small"
            style={{ backgroundColor: "#fafafa" }}
          >
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={!hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-muted">
              Page {curPage} of {lastPage}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
