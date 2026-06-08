import { useCallback, useEffect, useState } from "react";
import {
  adjustInventory,
  expireInventoryReservations,
  fetchInventoryAlerts,
  fetchInventoryVariants,
  receiveInventory,
  stocktakeInventory,
} from "../../api/admin/inventory";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

export default function AdminInventoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("manual_adjustment");
  const [note, setNote] = useState("");
  const [savingAdjust, setSavingAdjust] = useState(false);
  const [stocktakeCounted, setStocktakeCounted] = useState("");
  const [stocktakeNote, setStocktakeNote] = useState("");
  const [savingStocktake, setSavingStocktake] = useState(false);
  const [receiveQty, setReceiveQty] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [receiveNote, setReceiveNote] = useState("");
  const [savingReceive, setSavingReceive] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInventoryVariants({ q: q.trim() || undefined });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      showToast.error("Failed to load inventory.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchInventoryAlerts();
        setAlerts(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        setAlerts([]);
      }
    })();
  }, [rows.length]);

  async function onAdjust(e) {
    e.preventDefault();
    const parsed = Number(delta);
    if (!selectedId || !Number.isInteger(parsed) || parsed === 0) {
      showToast.error("Choose a variant and enter a non-zero integer delta.");
      return;
    }

    setSavingAdjust(true);
    try {
      await adjustInventory({
        variant_id: Number(selectedId),
        delta: parsed,
        reason: reason.trim() || "manual_adjustment",
        note: note.trim() || null,
      });
      showToast.success("Inventory updated.");
      setDelta("");
      setNote("");
      await load();
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to adjust inventory.");
    } finally {
      setSavingAdjust(false);
    }
  }

  async function onStocktake(e) {
    e.preventDefault();
    const counted = Number(stocktakeCounted);
    if (!selectedId || !Number.isInteger(counted) || counted < 0) {
      showToast.error("Choose a variant and enter a counted quantity (0 or more).");
      return;
    }
    setSavingStocktake(true);
    try {
      await stocktakeInventory({
        variant_id: Number(selectedId),
        counted,
        note: stocktakeNote.trim() || null,
      });
      showToast.success("Stocktake saved.");
      setStocktakeCounted("");
      setStocktakeNote("");
      await load();
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to save stocktake.");
    } finally {
      setSavingStocktake(false);
    }
  }

  async function onReceive(e) {
    e.preventDefault();
    const qty = Number(receiveQty);
    if (!selectedId || !Number.isInteger(qty) || qty <= 0) {
      showToast.error("Choose a variant and enter a quantity greater than zero.");
      return;
    }
    if (!supplierName.trim()) {
      showToast.error("Supplier name is required.");
      return;
    }
    setSavingReceive(true);
    try {
      await receiveInventory({
        variant_id: Number(selectedId),
        quantity: qty,
        supplier_name: supplierName.trim(),
        reference: supplierRef.trim() || null,
        note: receiveNote.trim() || null,
      });
      showToast.success("Stock received.");
      setReceiveQty("");
      setSupplierName("");
      setSupplierRef("");
      setReceiveNote("");
      await load();
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to receive stock.");
    } finally {
      setSavingReceive(false);
    }
  }

  async function handleExpireReservations() {
    try {
      const res = await expireInventoryReservations();
      showToast.success(
        `Expired reservations processed: ${res.data?.expired_orders ?? 0}`,
      );
      await load();
    } catch {
      showToast.error("Failed to process expired reservations.");
    }
  }

  return (
    <AdminPageShell
      iconClassName="fas fa-warehouse"
      title="Inventory"
      subtitle="Track stock and perform manual adjustments for product variants."
    >
      {alerts.length > 0 ? (
        <div className="alert alert-warning py-2">
          <strong>Low stock alerts:</strong> {alerts.length} variant(s) at or below threshold.
        </div>
      ) : null}
      <form
        className="rounded-3 p-3 mb-3 d-flex gap-2"
        style={{ backgroundColor: "#fff", border: T.cardBorder }}
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          className="form-control form-control-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product, variant, or SKU"
        />
        <button type="submit" className="btn btn-sm btn-outline-secondary">
          Search
        </button>
      </form>

      <div className="rounded-3 p-3 mb-3" style={{ backgroundColor: "#fff", border: T.cardBorder }}>
        <h3 className="h6 mb-3">Manual stock operations</h3>
        <div className="mb-2 d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            onClick={handleExpireReservations}
          >
            Expire overdue reservations
          </button>
        </div>
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <h4 className="h6">Adjust (delta)</h4>
            <form className="row g-2 align-items-end" onSubmit={onAdjust}>
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Variant</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Select variant…</option>
                  {rows.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.product_name} - {r.variant_label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small text-muted mb-1">Delta</label>
                <input
                  className="form-control form-control-sm"
                  type="number"
                  step="1"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  placeholder="e.g. 5 / -2"
                />
              </div>
              <div className="col-6">
                <label className="form-label small text-muted mb-1">Reason</label>
                <input
                  className="form-control form-control-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Note (optional)</label>
                <input
                  className="form-control form-control-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  style={{ backgroundColor: T.primaryGreen, border: "none" }}
                  disabled={savingAdjust}
                >
                  {savingAdjust ? "Saving…" : "Apply adjustment"}
                </button>
              </div>
            </form>
          </div>

          <div className="col-12 col-lg-4">
            <h4 className="h6">Stocktake (count)</h4>
            <form className="row g-2 align-items-end" onSubmit={onStocktake}>
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Counted quantity</label>
                <input
                  className="form-control form-control-sm"
                  type="number"
                  min="0"
                  value={stocktakeCounted}
                  onChange={(e) => setStocktakeCounted(e.target.value)}
                  placeholder="e.g. 23"
                />
              </div>
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Note (optional)</label>
                <input
                  className="form-control form-control-sm"
                  value={stocktakeNote}
                  onChange={(e) => setStocktakeNote(e.target.value)}
                  placeholder="e.g. End-of-day count"
                />
              </div>
              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-sm btn-outline-primary"
                  disabled={savingStocktake}
                >
                  {savingStocktake ? "Saving…" : "Save stocktake"}
                </button>
              </div>
            </form>
          </div>

          <div className="col-12 col-lg-4">
            <h4 className="h6">Receive from supplier</h4>
            <form className="row g-2 align-items-end" onSubmit={onReceive}>
              <div className="col-6">
                <label className="form-label small text-muted mb-1">Quantity</label>
                <input
                  className="form-control form-control-sm"
                  type="number"
                  min="1"
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(e.target.value)}
                  placeholder="e.g. 12"
                />
              </div>
              <div className="col-6">
                <label className="form-label small text-muted mb-1">Supplier</label>
                <input
                  className="form-control form-control-sm"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Supplier Inc."
                />
              </div>
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Reference (optional)</label>
                <input
                  className="form-control form-control-sm"
                  value={supplierRef}
                  onChange={(e) => setSupplierRef(e.target.value)}
                  placeholder="Invoice / DR #"
                />
              </div>
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Note (optional)</label>
                <input
                  className="form-control form-control-sm"
                  value={receiveNote}
                  onChange={(e) => setReceiveNote(e.target.value)}
                  placeholder="e.g. New delivery"
                />
              </div>
              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-sm btn-outline-success"
                  disabled={savingReceive}
                >
                  {savingReceive ? "Saving…" : "Receive stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="rounded-3 overflow-hidden" style={{ border: T.cardBorder }}>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th>SKU</th>
                <th>Track</th>
                <th className="text-end">Stock</th>
                <th className="text-end">Low stock at</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">No variants found.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className={r.is_low_stock ? "table-warning" : ""}>
                    <td>{r.product_name}</td>
                    <td>{r.variant_label}</td>
                    <td>{r.sku || "—"}</td>
                    <td>{r.track_stock ? "Yes" : "No"}</td>
                    <td className="text-end">{r.stock_on_hand}</td>
                    <td className="text-end">{r.low_stock_threshold}</td>
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

