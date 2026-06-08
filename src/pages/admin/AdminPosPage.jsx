import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProducts } from "../../api/admin/products";
import { createPosOrder, markPosOrderPaid } from "../../api/admin/pos";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

function money(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function normalizeProductsResponse(res) {
  const body = res?.data ?? {};
  return Array.isArray(body.data) ? body.data : [];
}

export default function AdminPosPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [q, setQ] = useState("");

  const [lines, setLines] = useState([]); // { variant, product, quantity }
  const [fulfillmentType, setFulfillmentType] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [terminalLabel, setTerminalLabel] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("manual_qr");
  const [paymentReference, setPaymentReference] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetchProducts({ per_page: 100, q: q.trim() || undefined });
      setProducts(normalizeProductsResponse(res));
    } catch {
      setProducts([]);
      showToast.error("Failed to load products.");
    } finally {
      setLoadingProducts(false);
    }
  }, [q]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const variants = useMemo(() => {
    const out = [];
    for (const p of products) {
      const vs = Array.isArray(p.variants) ? p.variants : [];
      for (const v of vs) {
        out.push({ product: p, variant: v });
      }
    }
    return out;
  }, [products]);

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => sum + Number(l.variant?.price || 0) * l.quantity, 0);
  }, [lines]);

  const deliveryFee = useMemo(() => {
    // Display-only estimate; server remains source of truth.
    return fulfillmentType === "delivery"
      ? Number(import.meta.env.VITE_STOREFRONT_DELIVERY_FEE || 50)
      : 0;
  }, [fulfillmentType]);

  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  function addVariant(product, variant) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.variant.id === variant.id);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], quantity: Math.min(99, copy[idx].quantity + 1) };
        return copy;
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
  }

  function setQty(variantId, qty) {
    const qn = Math.max(1, Math.min(99, Number(qty) || 1));
    setLines((prev) =>
      prev.map((l) => (l.variant.id === variantId ? { ...l, quantity: qn } : l)),
    );
  }

  function removeLine(variantId) {
    setLines((prev) => prev.filter((l) => l.variant.id !== variantId));
  }

  async function checkoutPos() {
    if (!customerName.trim()) {
      showToast.error("Customer name is required.");
      return;
    }
    if (lines.length === 0) {
      showToast.error("Add at least one item.");
      return;
    }
    if (fulfillmentType === "delivery" && !deliveryAddress.trim()) {
      showToast.error("Delivery address is required for delivery orders.");
      return;
    }
    setSaving(true);
    try {
      const res = await createPosOrder({
        pos_terminal_label: terminalLabel.trim() || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_email: customerEmail.trim() || null,
        fulfillment_type: fulfillmentType,
        delivery_address: fulfillmentType === "delivery" ? deliveryAddress.trim() : null,
        notes: notes.trim() || null,
        items: lines.map((l) => ({ variant_id: l.variant.id, quantity: l.quantity })),
      });
      const order = res.data?.order;
      if (!order?.id) throw new Error("Order not created.");

      const paidRes = await markPosOrderPaid(order.id, {
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim() || null,
      });
      const updated = paidRes.data?.data ?? paidRes.data;
      showToast.success("POS order created and marked paid.");

      setLines([]);
      setNotes("");
      setPaymentReference("");
      navigate(`/admin/pos/receipt/${updated?.id ?? order.id}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors ||
        err?.message ||
        "POS checkout failed.";
      showToast.error(typeof msg === "string" ? msg : "POS checkout failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      iconClassName="fas fa-cash-register"
      title="POS"
      subtitle="Create walk-in orders, record manual payments, and print receipts."
      headerActions={
        <Link to="/admin/orders" className="btn btn-sm btn-outline-secondary">
          View orders
        </Link>
      }
    >
      <div className="row g-3">
        <div className="col-lg-7">
          <div
            className="rounded-3 p-3 mb-3"
            style={{ backgroundColor: "#fff", border: T.cardBorder }}
          >
            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <div className="fw-semibold">Catalog</div>
              <div className="d-flex gap-2">
                <input
                  className="form-control form-control-sm"
                  placeholder="Search products"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadProducts}
                  disabled={loadingProducts}
                >
                  Search
                </button>
              </div>
            </div>
            <div className="small text-muted mt-1">
              Click a variant to add it to the POS cart.
            </div>

            <div className="mt-3">
              {loadingProducts ? (
                <div className="text-muted small py-3">Loading…</div>
              ) : variants.length === 0 ? (
                <div className="text-muted small py-3">No products found.</div>
              ) : (
                <div className="row g-2">
                  {variants.map(({ product, variant }) => (
                    <div className="col-12 col-md-6" key={variant.id}>
                      <button
                        type="button"
                        className="w-100 text-start btn btn-sm btn-outline-success"
                        onClick={() => addVariant(product, variant)}
                      >
                        <div className="fw-semibold">
                          {product.name} — {variant.label}
                        </div>
                        <div className="small text-muted">
                          ₱ {money(variant.price)}
                          {variant.track_stock ? ` · Stock ${variant.stock_on_hand}` : ""}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div
            className="rounded-3 p-3 mb-3"
            style={{ backgroundColor: "#fff", border: T.cardBorder }}
          >
            <div className="fw-semibold mb-2">Cart</div>
            {lines.length === 0 ? (
              <div className="text-muted small">No items yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th style={{ width: 90 }}>Qty</th>
                      <th className="text-end">Price</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.variant.id}>
                        <td className="small">
                          <div className="fw-semibold">
                            {l.product.name} ({l.variant.label})
                          </div>
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            inputMode="numeric"
                            value={l.quantity}
                            onChange={(e) =>
                              setQty(l.variant.id, e.target.value.replace(/\D/g, ""))
                            }
                          />
                        </td>
                        <td className="text-end small font-monospace">
                          {money(Number(l.variant.price || 0) * l.quantity)}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeLine(l.variant.id)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-top pt-3 mt-3 small">
              <div className="d-flex justify-content-between">
                <span>Subtotal</span>
                <span className="font-monospace">₱ {money(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Delivery fee</span>
                <span className="font-monospace">₱ {money(deliveryFee)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold">
                <span>Total</span>
                <span className="font-monospace">₱ {money(total)}</span>
              </div>
              <div className="text-muted mt-1">
                Totals are finalized server-side.
              </div>
            </div>
          </div>

          <div
            className="rounded-3 p-3"
            style={{ backgroundColor: "#fff", border: T.cardBorder }}
          >
            <div className="fw-semibold mb-2">Customer & payment</div>
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Terminal label (optional)</label>
                <input
                  className="form-control form-control-sm"
                  value={terminalLabel}
                  onChange={(e) => setTerminalLabel(e.target.value)}
                  placeholder="e.g. Counter 1"
                />
              </div>
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Customer name</label>
                <input
                  className="form-control form-control-sm"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted mb-1">Phone</label>
                <input
                  className="form-control form-control-sm"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted mb-1">Email (for receipt)</label>
                <input
                  type="email"
                  className="form-control form-control-sm"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted mb-1">Fulfillment</label>
                <select
                  className="form-select form-select-sm"
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value)}
                >
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted mb-1">Payment method</label>
                <select
                  className="form-select form-select-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="manual_qr">QR (manual)</option>
                  <option value="manual_card">Card (manual)</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              {fulfillmentType === "delivery" ? (
                <div className="col-12">
                  <label className="form-label small text-muted mb-1">Delivery address</label>
                  <input
                    className="form-control form-control-sm"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street / barangay / landmarks"
                  />
                </div>
              ) : null}
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Payment reference (optional)</label>
                <input
                  className="form-control form-control-sm"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. last 4 digits / receipt #"
                />
              </div>
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Order notes (optional)</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="col-12 d-grid">
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  style={{ backgroundColor: T.primaryGreen, border: "none" }}
                  disabled={saving}
                  onClick={checkoutPos}
                >
                  {saving ? "Processing…" : "Create order + mark paid + print receipt"}
                </button>
              </div>
              <div className="col-12">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary w-100"
                  onClick={() => navigate("/admin/orders")}
                >
                  Go to Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}

