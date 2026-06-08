import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminSessions,
  revokeAdminSession,
  revokeOtherAdminSessions,
} from "../../api/admin/security";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

export default function AdminSecurityPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminSessions();
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      showToast.error("Failed to load active sessions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revokeOthers() {
    setSaving(true);
    try {
      await revokeOtherAdminSessions();
      showToast.success("Other sessions revoked.");
      await load();
    } catch {
      showToast.error("Failed to revoke other sessions.");
    } finally {
      setSaving(false);
    }
  }

  async function revokeOne(id) {
    setSaving(true);
    try {
      await revokeAdminSession(id);
      showToast.success("Session revoked.");
      await load();
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to revoke session.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      iconClassName="fas fa-user-shield"
      title="Session security"
      subtitle="Review and revoke active admin API sessions."
    >
      <div className="rounded-3 p-3 mb-3" style={{ backgroundColor: "#fff", border: T.cardBorder }}>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={revokeOthers}
          disabled={saving || loading}
        >
          Revoke all other sessions
        </button>
      </div>

      <div className="rounded-3 overflow-hidden" style={{ border: T.cardBorder }}>
        <div className="table-responsive">
          <table className="table table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Created</th>
                <th>Last used</th>
                <th>Current</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">No sessions.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name || "spa"}</td>
                    <td className="small text-muted">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                    <td className="small text-muted">{r.last_used_at ? new Date(r.last_used_at).toLocaleString() : "Never"}</td>
                    <td>{r.is_current ? <span className="badge text-bg-success">Current</span> : "—"}</td>
                    <td>
                      {!r.is_current ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => revokeOne(r.id)}
                          disabled={saving}
                        >
                          Revoke
                        </button>
                      ) : null}
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

