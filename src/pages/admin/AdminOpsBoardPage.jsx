import { useEffect, useState } from "react";
import { fetchAdminOpsBoard, patchAdminDispatch } from "../../api/admin/ops";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

export default function AdminOpsBoardPage() {
  const [tab, setTab] = useState("kitchen");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchByOrder, setDispatchByOrder] = useState({});
  const [etaByOrder, setEtaByOrder] = useState({});

  async function load(nextTab = tab) {
    setLoading(true);
    try {
      const res = await fetchAdminOpsBoard({ tab: nextTab });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      showToast.error("Failed to load ops board.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function assignDispatch(orderId) {
    try {
      await patchAdminDispatch(orderId, {
        dispatch_assignee: dispatchByOrder[orderId] || "",
        dispatch_eta_minutes: etaByOrder[orderId] ? Number(etaByOrder[orderId]) : null,
      });
      showToast.success("Dispatch assignment saved.");
      await load(tab);
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to assign dispatch.");
    }
  }

  return (
    <AdminPageShell
      iconClassName="fas fa-clipboard-check"
      title="Ops board"
      subtitle="Kitchen queue and dispatch board with SLA timers."
    >
      <div className="mb-3 d-flex gap-2">
        <button
          className={`btn btn-sm ${tab === "kitchen" ? "btn-primary" : "btn-outline-secondary"}`}
          style={tab === "kitchen" ? { backgroundColor: T.primaryGreen, border: "none" } : {}}
          onClick={() => setTab("kitchen")}
          type="button"
        >
          Kitchen
        </button>
        <button
          className={`btn btn-sm ${tab === "dispatch" ? "btn-primary" : "btn-outline-secondary"}`}
          style={tab === "dispatch" ? { backgroundColor: T.primaryGreen, border: "none" } : {}}
          onClick={() => setTab("dispatch")}
          type="button"
        >
          Dispatch
        </button>
      </div>

      <div className="rounded-3 overflow-hidden" style={{ border: T.cardBorder }}>
        <div className="table-responsive">
          <table className="table table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Customer</th>
                <th className="text-end">Elapsed</th>
                <th className="text-end">SLA</th>
                {tab === "dispatch" ? <th>Dispatch</th> : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={tab === "dispatch" ? 6 : 5} className="text-center py-4 text-muted">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={tab === "dispatch" ? 6 : 5} className="text-center py-4 text-muted">No orders in this board.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className={r.sla_breached ? "table-danger" : ""}>
                    <td><code>{r.order_number}</code></td>
                    <td>{r.status}</td>
                    <td>{r.customer_name}</td>
                    <td className="text-end">{r.elapsed_minutes}m</td>
                    <td className="text-end">{r.sla_minutes}m</td>
                    {tab === "dispatch" ? (
                      <td>
                        <div className="d-flex gap-1">
                          <input
                            className="form-control form-control-sm"
                            placeholder="Assignee"
                            value={dispatchByOrder[r.id] ?? r.dispatch_assignee ?? ""}
                            onChange={(e) =>
                              setDispatchByOrder((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                          />
                          <input
                            className="form-control form-control-sm"
                            placeholder="ETA"
                            style={{ width: 80 }}
                            value={etaByOrder[r.id] ?? r.dispatch_eta_minutes ?? ""}
                            onChange={(e) =>
                              setEtaByOrder((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => assignDispatch(r.id)}
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    ) : null}
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

