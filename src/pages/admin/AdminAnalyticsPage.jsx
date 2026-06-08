import { useEffect, useState } from "react";
import { fetchAdminAnalyticsOverview } from "../../api/admin/analytics";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

export default function AdminAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load(from = dateFrom, to = dateTo) {
    setLoading(true);
    try {
      const res = await fetchAdminAnalyticsOverview({
        date_from: from || undefined,
        date_to: to || undefined,
      });
      const body = res.data?.data ?? null;
      setData(body);
      if (!dateFrom && body?.range?.date_from) setDateFrom(body.range.date_from);
      if (!dateTo && body?.range?.date_to) setDateTo(body.range.date_to);
    } catch {
      showToast.error("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const k = data?.kpis ?? {};

  return (
    <AdminPageShell
      iconClassName="fas fa-chart-pie"
      title="Analytics"
      subtitle="Track sales, order flow, and top-selling items for the selected date range."
    >
      <form
        className="rounded-3 p-3 mb-3"
        style={{ backgroundColor: "#fff", border: T.cardBorder }}
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-3">
            <label className="form-label small text-muted mb-1">From</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small text-muted mb-1">To</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              style={{ backgroundColor: T.primaryGreen, border: "none" }}
              disabled={loading}
            >
              {loading ? "Loading…" : "Apply range"}
            </button>
          </div>
        </div>
      </form>

      <div className="row g-3 mb-3">
        {[
          { label: "Orders", value: k.order_count ?? 0 },
          { label: "Gross sales", value: `₱${Number(k.gross_sales ?? 0).toFixed(2)}` },
          { label: "Average order", value: `₱${Number(k.average_order_value ?? 0).toFixed(2)}` },
          { label: "Completed", value: k.completed_orders ?? 0 },
        ].map((card) => (
          <div className="col-6 col-lg-3" key={card.label}>
            <div className="rounded-3 p-3 h-100" style={{ backgroundColor: "#fff", border: T.cardBorder }}>
              <div className="small text-muted">{card.label}</div>
              <div className="h5 mb-0" style={{ color: T.titleColor }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="rounded-3 p-3 h-100" style={{ backgroundColor: "#fff", border: T.cardBorder }}>
            <h3 className="h6">Status breakdown</h3>
            {!data ? (
              <p className="text-muted small mb-0">No data.</p>
            ) : (
              <ul className="mb-0 small">
                {(data.status_breakdown ?? []).map((row) => (
                  <li key={row.status}>
                    {String(row.status || "").replace(/_/g, " ")} - {row.count}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="rounded-3 p-3 h-100" style={{ backgroundColor: "#fff", border: T.cardBorder }}>
            <h3 className="h6">Top products</h3>
            {!data ? (
              <p className="text-muted small mb-0">No data.</p>
            ) : (
              <ul className="mb-0 small">
                {(data.top_products ?? []).map((row) => (
                  <li key={row.product_name}>
                    {row.product_name} - {row.quantity} sold (₱
                    {Number(row.revenue ?? 0).toFixed(2)})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}

