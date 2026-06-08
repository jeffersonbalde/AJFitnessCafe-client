import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { fetchOrderByNumber } from "../../api/orders";

/** Order API payload (Laravel JsonResource + axios). */
function normalizeOrder(raw) {
  if (!raw) return null;
  const o = raw.data !== undefined ? raw.data : raw;
  return o && typeof o === "object" ? o : null;
}

function needsPaymentPolling(status) {
  if (!status) return false;
  return status === "pending_payment" || status === "authorized";
}

function statusMeta(status) {
  switch (status) {
    case "pending_payment":
      return {
        badgeClass: "bg-warning text-dark",
        badgeText: "Confirming payment",
        title: "Processing your payment",
        body: "We are waiting for Maya to confirm your payment. This usually takes a few seconds.",
      };
    case "authorized":
      return {
        badgeClass: "bg-info text-dark",
        badgeText: "Payment authorized",
        title: "Almost done",
        body: "Your payment is authorized. Final confirmation may follow shortly.",
      };
    case "paid":
      return {
        badgeClass: "bg-success",
        badgeText: "Payment received",
        title: "Thank you!",
        body: "Your payment was successful. We have your order.",
      };
    case "payment_failed":
      return {
        badgeClass: "bg-danger",
        badgeText: "Payment failed",
        title: "Payment could not be completed",
        body: "The payment did not go through. You can return to your cart and try again.",
      };
    case "payment_expired":
      return {
        badgeClass: "bg-secondary",
        badgeText: "Payment expired",
        title: "Checkout timed out",
        body: "The payment window closed before completion. Place a new order when you are ready.",
      };
    case "cancelled":
      return {
        badgeClass: "bg-secondary",
        badgeText: "Cancelled",
        title: "Payment cancelled",
        body: "Checkout was cancelled. Your cart items are unchanged if you did not complete payment.",
      };
    case "pending":
      return {
        badgeClass: "bg-success",
        badgeText: "Order received",
        title: "Thank you!",
        body: "We have received your order.",
      };
    case "preparing":
      return {
        badgeClass: "bg-primary",
        badgeText: "Being prepared",
        title: "We’re on it",
        body: "Your order is being prepared. Check back here for updates.",
      };
    case "ready":
      return {
        badgeClass: "bg-info text-dark",
        badgeText: "Ready",
        title: "Your order is ready",
        body: "Head to the cafe for pickup, or watch for delivery updates if you chose delivery.",
      };
    case "out_for_delivery":
      return {
        badgeClass: "bg-info text-dark",
        badgeText: "On the way",
        title: "Out for delivery",
        body: "Your order is on the way to the address you provided.",
      };
    case "completed":
      return {
        badgeClass: "bg-secondary",
        badgeText: "Completed",
        title: "Thank you!",
        body: "Your order is complete. We hope you enjoy it.",
      };
    default:
      return {
        badgeClass: "bg-light text-dark border",
        badgeText: status?.replace(/_/g, " ") || "Status",
        title: "Order update",
        body: "See status below.",
      };
  }
}

const POLL_MS = 2000;
const MAX_POLLS = 90;

export default function OrderThanksPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const fromState = location.state?.order;
  const refParam = params.get("ref");
  const [order, setOrder] = useState(() => normalizeOrder(fromState));
  const [loading, setLoading] = useState(!fromState && Boolean(refParam));
  const [error, setError] = useState(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollCountRef = useRef(0);

  const loadOrder = useCallback(async (orderNumber) => {
    const res = await fetchOrderByNumber(orderNumber);
    return normalizeOrder(res.data);
  }, []);

  // Initial load: ?ref= from Maya redirect, or hydrate from navigation state
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (refParam) {
        setLoading(true);
        setError(null);
        try {
          const o = await loadOrder(refParam);
          if (!cancelled) {
            setOrder(o);
            if (!o) setError("We could not load this order.");
          }
        } catch {
          if (!cancelled) {
            setError("We could not load this order.");
            setOrder(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      if (fromState) {
        const o = normalizeOrder(fromState);
        setOrder(o);
        if (o?.order_number && needsPaymentPolling(o.status)) {
          try {
            const fresh = await loadOrder(o.order_number);
            if (!cancelled && fresh) setOrder(fresh);
          } catch {
            /* keep state order */
          }
        }
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [refParam, fromState, loadOrder]);

  // Poll while payment is still being confirmed (webhook may arrive after redirect)
  useEffect(() => {
    if (!order?.order_number || !needsPaymentPolling(order.status)) {
      pollCountRef.current = 0;
      setPollTimedOut(false);
      return undefined;
    }

    const orderNumber = order.order_number;
    pollCountRef.current = 0;
    setPollTimedOut(false);

    const timer = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLLS) {
        clearInterval(timer);
        setPollTimedOut(true);
        return;
      }
      try {
        const o = await loadOrder(orderNumber);
        if (o) {
          setOrder(o);
          if (!needsPaymentPolling(o.status)) {
            clearInterval(timer);
          }
        }
      } catch {
        // network blip — keep polling until max
      }
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [order?.order_number, order?.status, loadOrder]);

  if (loading) {
    return <p className="text-muted py-5 text-center">Loading order…</p>;
  }

  if (error || !order) {
    return (
      <div className="text-center py-5">
        <p className="text-muted mb-3">{error || "No order to display."}</p>
        <Link to="/menu" className="btn btn-primary">
          Back to menu
        </Link>
      </div>
    );
  }

  const meta = statusMeta(order.status);
  const showFailureActions =
    order.status === "payment_failed" ||
    order.status === "payment_expired" ||
    order.status === "cancelled";
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="text-center py-4 px-2">
      <div className="mb-3">
        <span className={`badge fs-6 ${meta.badgeClass}`}>{meta.badgeText}</span>
      </div>
      <h1 className="h3 mb-2" style={{ color: "var(--primary-dark)" }}>
        {meta.title}
      </h1>
      <p className="text-muted mb-2 small mx-auto" style={{ maxWidth: 420 }}>
        {meta.body}
      </p>
      {needsPaymentPolling(order.status) && !pollTimedOut ? (
        <p className="small text-muted mb-3">
          <span
            className="spinner-border spinner-border-sm me-2 align-middle"
            role="status"
            aria-hidden="true"
          />
          Checking payment status…
        </p>
      ) : null}
      {pollTimedOut && needsPaymentPolling(order.status) ? (
        <p className="small text-warning-emphasis mb-3">
          Confirmation is taking longer than usual. Your reference is still valid — refresh this page
          in a minute or contact us with your order number.
        </p>
      ) : null}

      <p className="text-muted mb-1 small">
        Reference{" "}
        <strong className="text-dark">{order.order_number}</strong>
      </p>
      <p className="small text-muted mb-4">
        Save this number for{" "}
        {order.fulfillment_type === "delivery" ? "delivery" : "pickup"} updates.
      </p>

      <div
        className="card border-0 shadow-sm mx-auto text-start"
        style={{ maxWidth: 420 }}
      >
        <div className="card-body small">
          <div className="d-flex justify-content-between">
            <span>Total</span>
            <strong>₱{Number(order.grand_total).toFixed(2)}</strong>
          </div>
          <div className="d-flex justify-content-between mt-2">
            <span>Status</span>
            <span className="text-capitalize">
              {String(order.status).replace(/_/g, " ")}
            </span>
          </div>
          {order.maya_payment_status ? (
            <div className="d-flex justify-content-between mt-1">
              <span className="text-muted">Payment</span>
              <span className="text-muted">{order.maya_payment_status}</span>
            </div>
          ) : null}
        </div>
      </div>

      {items.length > 0 ? (
        <div
          className="card border-0 shadow-sm mx-auto text-start mt-3"
          style={{ maxWidth: 420 }}
        >
          <div className="card-header bg-white py-2 small fw-semibold">Items</div>
          <ul className="list-group list-group-flush small">
            {items.map((line) => (
              <li
                key={line.id ?? `${line.product_variant_id}-${line.variant_label}`}
                className="list-group-item d-flex justify-content-between align-items-start"
              >
                <span>
                  {line.product_name}
                  {line.variant_label ? (
                    <span className="text-muted"> · {line.variant_label}</span>
                  ) : null}
                  <span className="text-muted"> × {line.quantity}</span>
                </span>
                <span className="text-nowrap ms-2">
                  ₱{Number(line.line_total).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 d-flex flex-wrap justify-content-center gap-2">
        {showFailureActions ? (
          <Link to="/cart" className="btn btn-primary">
            Back to cart
          </Link>
        ) : null}
        <Link to="/menu" className="btn btn-primary">
          Order more
        </Link>
        <Link to="/" className="btn btn-outline-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
