import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyOrders } from "../../api/meOrders";
import { showToast } from "../../services/notificationService";

/** @param {string | undefined} status */
function statusBadgeClass(status) {
  switch (status) {
    case "paid":
    case "pending":
      return "bg-success";
    case "preparing":
      return "bg-primary";
    case "ready":
      return "bg-info text-dark";
    case "pending_payment":
    case "authorized":
      return "bg-warning text-dark";
    case "payment_failed":
    case "cancelled":
      return "bg-danger";
    case "payment_expired":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await fetchMyOrders(p, 15);
      const payload = res.data;
      setOrders(Array.isArray(payload?.data) ? payload.data : []);
      setMeta(payload?.meta ?? null);
    } catch {
      showToast.error("Could not load your orders.");
      setOrders([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const lastPage = meta?.last_page ?? 1;

  return (
    <div className="py-2">
      <h1 className="h4 mb-3" style={{ color: "var(--primary-dark)" }}>
        My orders
      </h1>
      <p className="small text-muted mb-4">
        Orders you place while signed in appear here. Guest orders are not linked
        to your account.
      </p>

      {loading ? (
        <div className="text-muted small py-4">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <p className="text-muted mb-3">No orders yet.</p>
            <Link to="/menu" className="btn btn-primary">
              Browse menu
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive card border-0 shadow-sm">
            <table className="table table-hover mb-0 small align-middle">
              <thead className="table-light">
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id ?? o.order_number}>
                    <td>
                      <Link
                        to={`/account/orders/${encodeURIComponent(o.order_number)}`}
                        className="fw-semibold text-decoration-none"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="text-muted">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${statusBadgeClass(o.status)}`}
                      >
                        {o.status?.replace(/_/g, " ") ?? "—"}
                      </span>
                    </td>
                    <td className="text-end">
                      ₱{Number.parseFloat(o.grand_total ?? "0").toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lastPage > 1 ? (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="small text-muted">
                Page {meta?.current_page ?? page} of {lastPage}
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
