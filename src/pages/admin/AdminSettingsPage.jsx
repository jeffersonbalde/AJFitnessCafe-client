import { useEffect, useState } from "react";
import { fetchAdminSettings, patchAdminSettings } from "../../api/admin/settings";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

const INITIAL_FORM = {
  delivery_fee_flat: 50,
  store_phone: "",
  store_email: "",
  store_address: "",
  business_hours: "",
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchAdminSettings();
        const row = res.data?.data ?? {};
        if (cancelled) return;
        setForm({
          delivery_fee_flat: Number(row.delivery_fee_flat ?? 50),
          store_phone: row.store_phone ?? "",
          store_email: row.store_email ?? "",
          store_address: row.store_address ?? "",
          business_hours: row.business_hours ?? "",
        });
      } catch {
        if (!cancelled) showToast.error("Failed to load admin settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        delivery_fee_flat: Number(form.delivery_fee_flat || 0),
      };
      const res = await patchAdminSettings(payload);
      const row = res.data?.data ?? {};
      setForm({
        delivery_fee_flat: Number(row.delivery_fee_flat ?? payload.delivery_fee_flat),
        store_phone: row.store_phone ?? "",
        store_email: row.store_email ?? "",
        store_address: row.store_address ?? "",
        business_hours: row.business_hours ?? "",
      });
      showToast.success("Settings saved.");
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      iconClassName="fas fa-sliders-h"
      title="Store settings"
      subtitle="Control storefront defaults and contact details used by staff."
    >
      <form
        onSubmit={onSubmit}
        className="rounded-3 p-3"
        style={{ backgroundColor: "#fff", border: T.cardBorder }}
      >
        {loading ? <p className="text-muted mb-0">Loading settings…</p> : null}
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label small text-muted">Delivery fee (PHP)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="form-control"
              value={form.delivery_fee_flat}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, delivery_fee_flat: e.target.value }))
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted">Store phone</label>
            <input
              type="text"
              className="form-control"
              value={form.store_phone}
              onChange={(e) => setForm((prev) => ({ ...prev, store_phone: e.target.value }))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted">Store email</label>
            <input
              type="email"
              className="form-control"
              value={form.store_email}
              onChange={(e) => setForm((prev) => ({ ...prev, store_email: e.target.value }))}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small text-muted">Store address</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.store_address}
              onChange={(e) => setForm((prev) => ({ ...prev, store_address: e.target.value }))}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small text-muted">Business hours</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.business_hours}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, business_hours: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="mt-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || loading}
            style={{ backgroundColor: T.primaryGreen, border: "none" }}
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </AdminPageShell>
  );
}

