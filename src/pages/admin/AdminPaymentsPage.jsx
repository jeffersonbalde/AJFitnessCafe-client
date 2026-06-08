import { useEffect, useState } from "react";
import { fetchAdminPaymentAlerts } from "../../api/admin/payments";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchAdminPaymentAlerts();
        if (!cancelled) setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        if (!cancelled) showToast.error("Failed to load payment alerts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminPageShell
      iconClassName="fas fa-credit-card"
      title="Payment alerts"
      subtitle="Monitor pending/failed payments and refund states."
    >
      <div className="rounded-3 overflow-hidden" style={{ border: T.cardBorder }}>
        <div className="table-responsive">
          <table className="table table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Maya</th>
                <th>Refund</th>
                <th className="text-end">Total</th>
                <th className="text-end">Refunded</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">No payment alerts.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td><code>{r.order_number}</code></td>
                    <td>{r.status}</td>
                    <td>{r.maya_payment_status || "—"}</td>
                    <td>{r.refund_status || "—"}</td>
                    <td className="text-end">₱{Number(r.grand_total).toFixed(2)}</td>
                    <td className="text-end">₱{Number(r.refunded_amount || 0).toFixed(2)}</td>
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

