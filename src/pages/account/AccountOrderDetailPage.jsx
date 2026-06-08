import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchMyOrder } from "../../api/meOrders";
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

export default function AccountOrderDetailPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orderNumber) return;
    setLoading(true);
    try {
      const res = await fetchMyOrder(orderNumber);
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      setOrder(raw && typeof raw === "object" ? raw : null);
    } catch {
      showToast.error("Order not found or you do not have access.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="text-muted small py-5 text-center">Loading order…</div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-5">
        <p className="text-muted mb-3">We could not load this order.</p>
        <Link to="/account/orders" className="btn btn-primary">
          Back to my orders
        </Link>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const trackUrl = `/order/thanks?ref=${encodeURIComponent(order.order_number)}`;
  const needsPaymentWatch =
    order.status === "pending_payment" || order.status === "authorized";

  return (
    <div className="py-2">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/account/orders">My orders</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {order.order_number}
          </li>
        </ol>
      </nav>

      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1" style={{ color: "var(--primary-dark)" }}>
            Order {order.order_number}
          </h1>
          <p className="small text-muted mb-0">
            Placed{" "}
            {order.created_at
              ? new Date(order.created_at).toLocaleString()
              : "—"}
          </p>
        </div>
        <span className={`badge ${statusBadgeClass(order.status)} align-self-center`}>
          {order.status?.replace(/_/g, " ") ?? "—"}
        </span>
      </div>

      {needsPaymentWatch ? (
        <div className="alert alert-warning small mb-4">
          Payment may still be confirming.{" "}
          <Link to={trackUrl} className="alert-link">
            Open live status
          </Link>{" "}
          to watch for updates.
        </div>
      ) : null}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h6 mb-3">Items</h2>
          <ul className="list-unstyled small mb-0">
            {items.map((line) => (
              <li
                key={line.id}
                className="d-flex justify-content-between py-2 border-bottom"
              >
                <span>
                  {line.product_name} · {line.variant_label} × {line.quantity}
                </span>
                <span>
                  ₱{Number.parseFloat(line.line_total ?? "0").toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <ul className="list-unstyled small mt-3 mb-0">
            <li className="d-flex justify-content-between">
              <span>Subtotal</span>
              <span>₱{Number.parseFloat(order.subtotal ?? "0").toFixed(2)}</span>
            </li>
            {Number.parseFloat(order.delivery_fee ?? "0") > 0 ? (
              <li className="d-flex justify-content-between">
                <span>Delivery</span>
                <span>
                  ₱{Number.parseFloat(order.delivery_fee ?? "0").toFixed(2)}
                </span>
              </li>
            ) : null}
            <li className="d-flex justify-content-between fw-bold pt-2">
              <span>Total</span>
              <span className="text-brand">
                ₱{Number.parseFloat(order.grand_total ?? "0").toFixed(2)}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body small">
          <h2 className="h6 mb-3">Details</h2>
          <dl className="row mb-0">
            <dt className="col-sm-3 text-muted">Name</dt>
            <dd className="col-sm-9">{order.customer_name ?? "—"}</dd>
            <dt className="col-sm-3 text-muted">Phone</dt>
            <dd className="col-sm-9">{order.customer_phone ?? "—"}</dd>
            <dt className="col-sm-3 text-muted">Email</dt>
            <dd className="col-sm-9">{order.customer_email ?? "—"}</dd>
            <dt className="col-sm-3 text-muted">Fulfillment</dt>
            <dd className="col-sm-9">{order.fulfillment_type ?? "—"}</dd>
            {order.fulfillment_type === "delivery" && order.delivery_address ? (
              <>
                <dt className="col-sm-3 text-muted">Address</dt>
                <dd className="col-sm-9">{order.delivery_address}</dd>
              </>
            ) : null}
            {order.notes ? (
              <>
                <dt className="col-sm-3 text-muted">Notes</dt>
                <dd className="col-sm-9">{order.notes}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2">
        <Link to={trackUrl} className="btn btn-outline-primary btn-sm">
          Full status page
        </Link>
        <Link to="/account/orders" className="btn btn-outline-secondary btn-sm">
          All orders
        </Link>
      </div>
    </div>
  );
}
