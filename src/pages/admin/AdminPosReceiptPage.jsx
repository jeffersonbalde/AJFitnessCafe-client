import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPosOrder } from "../../api/admin/pos";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

function normalizeOrderPayload(res) {
  const raw = res?.data;
  if (!raw) return null;
  if (raw.order) return raw.order;
  return raw.data !== undefined ? raw.data : raw;
}

export default function AdminPosReceiptPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchPosOrder(id);
      setOrder(normalizeOrderPayload(res));
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <AdminPageShell
      iconClassName="fas fa-receipt"
      title="POS receipt"
      subtitle={order?.order_number ? `Order ${order.order_number}` : "Print-ready receipt"}
      headerActions={
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={() => window.print()}
            disabled={loading || !order}
          >
            Print
          </button>
          <Link to="/admin/pos" className="btn btn-sm btn-outline-secondary">
            Back to POS
          </Link>
        </div>
      }
    >
      {loading ? (
        <p className="text-muted py-4 mb-0">Loading…</p>
      ) : !order ? (
        <p className="text-muted py-4 mb-0">Receipt not found.</p>
      ) : (
        <div
          className="rounded-3 p-3"
          style={{
            backgroundColor: "#ffffff",
            border: T.cardBorder,
            maxWidth: 520,
            margin: "0 auto",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        >
          <div className="text-center mb-3">
            <div className="fw-bold">AJ Fitness Cafe</div>
            <div className="small text-muted">POS Receipt</div>
          </div>

          <div className="small d-flex justify-content-between">
            <span>Order</span>
            <span>{order.order_number}</span>
          </div>
          <div className="small d-flex justify-content-between">
            <span>Date</span>
            <span>
              {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
            </span>
          </div>
          <div className="small d-flex justify-content-between">
            <span>Payment</span>
            <span>{order.payment_method || "—"}</span>
          </div>
          {order.payment_reference ? (
            <div className="small d-flex justify-content-between">
              <span>Ref</span>
              <span>{order.payment_reference}</span>
            </div>
          ) : null}

          <hr />

          {items.length === 0 ? (
            <div className="small text-muted">No items.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {items.map((it) => (
                <div key={it.id ?? `${it.product_name}-${it.variant_label}`} className="small">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">
                      {it.product_name} ({it.variant_label})
                    </span>
                    <span>{it.line_total}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>
                      {it.quantity} × {it.unit_price}
                    </span>
                    <span />
                  </div>
                </div>
              ))}
            </div>
          )}

          <hr />

          <div className="small d-flex justify-content-between">
            <span>Subtotal</span>
            <span>{order.subtotal}</span>
          </div>
          <div className="small d-flex justify-content-between">
            <span>Delivery</span>
            <span>{order.delivery_fee}</span>
          </div>
          <div className="small d-flex justify-content-between fw-bold">
            <span>Total</span>
            <span>{order.grand_total}</span>
          </div>

          <hr />

          <div className="small text-center text-muted">
            Thank you!
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

