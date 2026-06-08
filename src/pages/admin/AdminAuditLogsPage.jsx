import { useCallback, useEffect, useState } from "react";
import { fetchAdminAuditLogs } from "../../api/admin/audit";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminAuditLogs({
        page,
        per_page: 25,
        q: appliedQ || undefined,
      });
      const body = res.data ?? {};
      const data = Array.isArray(body.data) ? body.data : [];
      setRows(data);
      setMeta({
        current_page: body.meta?.current_page ?? page,
        last_page: body.meta?.last_page ?? 1,
        total: body.meta?.total ?? data.length,
      });
    } catch {
      showToast.error("Failed to load audit logs.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, appliedQ]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilter(e) {
    e.preventDefault();
    setPage(1);
    setAppliedQ(q.trim());
  }

  return (
    <AdminPageShell
      iconClassName="fas fa-clipboard-list"
      title="Audit logs"
      subtitle="Track admin actions for accountability and troubleshooting."
    >
      <form
        onSubmit={applyFilter}
        className="rounded-3 p-3 mb-3 d-flex gap-2"
        style={{ backgroundColor: "#fff", border: T.cardBorder }}
      >
        <input
          className="form-control form-control-sm"
          value={q}
          placeholder="Search action, target, user name/email"
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn btn-sm btn-outline-secondary">
          Search
        </button>
      </form>

      <div className="rounded-3 overflow-hidden" style={{ border: T.cardBorder }}>
        <div
          className="px-3 py-2 d-flex justify-content-between small"
          style={{ backgroundColor: T.toolbarBg }}
        >
          <span>Admin activity</span>
          <span className="text-muted">{meta.total} total</span>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>User</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No logs found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="small text-muted">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                    </td>
                    <td>
                      <code>{r.action}</code>
                    </td>
                    <td>{r.user?.name || r.user?.email || "System"}</td>
                    <td>
                      {r.target_type || "—"}
                      {r.target_id ? `:${r.target_id}` : ""}
                    </td>
                    <td className="small text-muted">
                      {r.meta ? JSON.stringify(r.meta) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta.last_page > 1 ? (
          <div className="px-3 py-2 d-flex justify-content-between border-top">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={loading || meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="small text-muted">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={loading || meta.current_page >= meta.last_page}
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

