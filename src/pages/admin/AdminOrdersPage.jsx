import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { exportAdminOrdersCsv, fetchAdminOrders } from "../../api/admin/orders";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

/** Matches server OrderStatusTransition::filterableStatuses (labels for staff). */
const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "authorized", label: "Authorized" },
  { value: "paid", label: "Paid" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending", label: "Pending (legacy)" },
  { value: "payment_failed", label: "Payment failed" },
  { value: "payment_expired", label: "Payment expired" },
];

const FULFILLMENT_OPTIONS = [
  { value: "", label: "All types" },
  { value: "pickup", label: "Pickup" },
  { value: "delivery", label: "Delivery" },
];

function statusBadgeClass(status) {
  switch (status) {
    case "paid":
      return "success";
    case "preparing":
      return "primary";
    case "ready":
      return "info";
    case "out_for_delivery":
      return "info";
    case "completed":
      return "secondary";
    case "cancelled":
    case "payment_failed":
    case "payment_expired":
      return "dark";
    case "pending_payment":
    case "authorized":
      return "warning";
    default:
      return "light";
  }
}

export default function AdminOrdersPage() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [filterMayaStatus, setFilterMayaStatus] = useState("");
  const [filterFulfillmentType, setFilterFulfillmentType] = useState("");
  /** Applied filters (so typing dates doesn’t refetch until Apply). */
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedPaymentMethod, setAppliedPaymentMethod] = useState("");
  const [appliedMayaStatus, setAppliedMayaStatus] = useState("");
  const [appliedFulfillmentType, setAppliedFulfillmentType] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [appliedUserId, setAppliedUserId] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const uid = searchParams.get("user_id")?.trim() ?? "";
    setFilterUserId(uid);
    setAppliedUserId(uid);
    setPage(1);
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminOrders({
        page,
        per_page: 20,
        status: appliedStatus || undefined,
        q: appliedQuery || undefined,
        payment_method: appliedPaymentMethod || undefined,
        maya_payment_status: appliedMayaStatus || undefined,
        fulfillment_type: appliedFulfillmentType || undefined,
        date_from: appliedDateFrom || undefined,
        date_to: appliedDateTo || undefined,
        user_id:
          appliedUserId && /^\d+$/.test(appliedUserId)
            ? Number(appliedUserId)
            : undefined,
      });
      const body = res.data;
      const data = Array.isArray(body?.data) ? body.data : [];
      setRows(data);
      const m = body?.meta;
      if (m && typeof m === "object") {
        setMeta({
          current_page: m.current_page ?? page,
          last_page: m.last_page ?? 1,
          per_page: m.per_page ?? 20,
          total: m.total ?? data.length,
        });
      } else {
        setMeta({
          current_page: page,
          last_page: 1,
          per_page: 20,
          total: data.length,
        });
      }
    } catch {
      showToast.error("Failed to load orders.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    appliedStatus,
    appliedDateFrom,
    appliedDateTo,
    appliedQuery,
    appliedPaymentMethod,
    appliedMayaStatus,
    appliedFulfillmentType,
    appliedUserId,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters(e) {
    e?.preventDefault?.();
    setAppliedStatus(filterStatus);
    setAppliedDateFrom(filterDateFrom);
    setAppliedDateTo(filterDateTo);
    setAppliedQuery(filterQuery.trim());
    setAppliedPaymentMethod(filterPaymentMethod.trim());
    setAppliedMayaStatus(filterMayaStatus.trim());
    setAppliedFulfillmentType(filterFulfillmentType);
    setAppliedUserId(filterUserId.trim());
    setPage(1);
  }

  function clearFilters() {
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterQuery("");
    setFilterPaymentMethod("");
    setFilterMayaStatus("");
    setFilterFulfillmentType("");
    setAppliedStatus("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setAppliedQuery("");
    setAppliedPaymentMethod("");
    setAppliedMayaStatus("");
    setAppliedFulfillmentType("");
    setFilterUserId("");
    setAppliedUserId("");
    setPage(1);
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const res = await exportAdminOrdersCsv({
        status: appliedStatus || undefined,
        q: appliedQuery || undefined,
        payment_method: appliedPaymentMethod || undefined,
        maya_payment_status: appliedMayaStatus || undefined,
        fulfillment_type: appliedFulfillmentType || undefined,
        date_from: appliedDateFrom || undefined,
        date_to: appliedDateTo || undefined,
        user_id:
          appliedUserId && /^\d+$/.test(appliedUserId)
            ? Number(appliedUserId)
            : undefined,
      });
      const type = res.headers?.["content-type"] || "text/csv";
      const blob = new Blob([res.data], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
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

  return (
    <AdminPageShell
      iconClassName="fas fa-receipt"
      title="Orders"
      subtitle="Filter, page through, and open an order to update fulfillment status."
    >
      <form
        className="rounded-3 p-3 mb-3"
        style={{ backgroundColor: "#ffffff", border: T.cardBorder }}
        onSubmit={applyFilters}
      >
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1" htmlFor="ord-filter-status">
              Status
            </label>
            <select
              id="ord-filter-status"
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1" htmlFor="ord-date-from">
              From date
            </label>
            <input
              id="ord-date-from"
              type="date"
              className="form-control form-control-sm"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1" htmlFor="ord-date-to">
              To date
            </label>
            <input
              id="ord-date-to"
              type="date"
              className="form-control form-control-sm"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1" htmlFor="ord-fulfillment">
              Fulfillment
            </label>
            <select
              id="ord-fulfillment"
              className="form-select form-select-sm"
              value={filterFulfillmentType}
              onChange={(e) => setFilterFulfillmentType(e.target.value)}
            >
              {FULFILLMENT_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-2">
            <label className="form-label small text-muted mb-1" htmlFor="ord-payment-method">
              Payment method
            </label>
            <input
              id="ord-payment-method"
              className="form-control form-control-sm"
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              placeholder="maya_checkout"
            />
          </div>
          <div className="col-12 col-md-2">
            <label className="form-label small text-muted mb-1" htmlFor="ord-maya-status">
              Maya status
            </label>
            <input
              id="ord-maya-status"
              className="form-control form-control-sm"
              value={filterMayaStatus}
              onChange={(e) => setFilterMayaStatus(e.target.value)}
              placeholder="PAYMENT_SUCCESS"
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label small text-muted mb-1" htmlFor="ord-filter-q">
              Search
            </label>
            <input
              id="ord-filter-q"
              className="form-control form-control-sm"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Order #, customer name, phone, email"
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1" htmlFor="ord-filter-user-id">
              Customer user id
            </label>
            <input
              id="ord-filter-user-id"
              type="text"
              inputMode="numeric"
              className="form-control form-control-sm"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value.replace(/\D/g, ""))}
              placeholder="Account #"
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

      <div
        className="rounded-3 overflow-hidden"
        style={{ backgroundColor: "#ffffff", border: T.cardBorder }}
      >
        <div
          className="px-3 py-2 d-flex flex-wrap align-items-center justify-content-between gap-2"
          style={{
            backgroundColor: T.toolbarBg,
            borderBottom: "1px solid #e5e7eb",
            fontFamily: T.interFamily,
            fontWeight: 700,
            fontSize: "0.85rem",
            color: T.titleColor,
          }}
        >
          <span>Storefront orders</span>
          <span className="text-muted fw-normal small">
            {total} total
            {lastPage > 1
              ? ` · Page ${curPage} of ${lastPage}`
              : ""}
          </span>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Type</th>
                <th className="text-end">Total</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-muted py-4 text-center">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted py-4 text-center">
                    No orders match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="fw-semibold text-decoration-none"
                        style={{ color: T.primaryGreen }}
                      >
                        <code className="small text-dark">
                          {o.order_number}
                        </code>
                      </Link>
                    </td>
                    <td>{o.customer_name}</td>
                    <td>{o.customer_phone}</td>
                    <td className="text-capitalize">{o.fulfillment_type}</td>
                    <td className="text-end">
                      ₱{Number(o.grand_total).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`badge text-bg-${statusBadgeClass(
                          o.status,
                        )}`}
                      >
                        {String(o.status || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {lastPage > 1 ? (
          <div
            className="px-3 py-2 d-flex justify-content-between align-items-center border-top"
            style={{ backgroundColor: T.toolbarBg }}
          >
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={!hasPrev || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="small text-muted">
              Page {curPage} of {lastPage}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={!hasNext || loading}
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
