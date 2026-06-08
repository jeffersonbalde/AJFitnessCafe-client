import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "../../api/orders";
import { DELIVERY_FEE_FLAT } from "../../config/storefront";
import { useAuthContext } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../services/notificationService";
import { isAdminUser } from "../../utils/authRouting";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { resendVerificationEmail, getVerificationStatus, refreshMe } = useAuth();
  const { lines, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    fulfillment_type: "pickup",
    delivery_address: "",
    notes: "",
  });

  useEffect(() => {
    if (authLoading || !user || isAdminUser(user)) return;
    setForm((f) => {
      const next = { ...f };
      if (!String(next.customer_name ?? "").trim() && user.name) {
        next.customer_name = user.name;
      }
      if (!String(next.customer_email ?? "").trim() && user.email) {
        next.customer_email = user.email;
      }
      if (!String(next.customer_phone ?? "").trim() && user.phone) {
        next.customer_phone = user.phone;
      }
      return next;
    });
  }, [authLoading, user]);

  const deliveryFee =
    form.fulfillment_type === "delivery" ? DELIVERY_FEE_FLAT : 0;
  const grand = Math.round((subtotal + deliveryFee) * 100) / 100;
  const emailVerified = Boolean(user?.email_verified);

  async function handleSubmit(e) {
    e.preventDefault();
    if (lines.length === 0) {
      showToast.error("Your cart is empty.");
      return;
    }
    if (!emailVerified) {
      showToast.error("Please verify your email before checkout.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createOrder({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || undefined,
        fulfillment_type: form.fulfillment_type,
        payment_method: "maya_checkout",
        delivery_address:
          form.fulfillment_type === "delivery"
            ? form.delivery_address.trim()
            : undefined,
        notes: form.notes.trim() || undefined,
        items: lines.map((l) => ({
          variant_id: l.variantId,
          quantity: l.quantity,
        })),
      });
      const order = res.data?.order ?? res.data?.data;
      const redirectUrl =
        res.data?.maya_checkout?.redirectUrl ??
        res.data?.maya?.redirectUrl ??
        null;
      clearCart();
      if (redirectUrl) {
        showToast.success("Redirecting to Maya Checkout…");
        window.location.href = redirectUrl;
        return;
      }

      showToast.success("Order placed!");
      navigate("/order/thanks", {
        replace: true,
        state: { order },
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors ||
        err?.message ||
        "Could not place order.";
      const text =
        typeof msg === "string"
          ? msg
          : Object.values(msg || {})
              .flat()
              .join(" ");
      showToast.error(text || "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendVerification() {
    const res = await resendVerificationEmail();
    if (!res.success) {
      showToast.error(res.error);
      return;
    }
    showToast.success(res.message || "Verification email sent.");
  }

  async function handleCheckVerification() {
    const status = await getVerificationStatus();
    if (!status.success) {
      showToast.error(status.error);
      return;
    }
    await refreshMe();
    if (status.verified) {
      showToast.success("Email verified. You can checkout now.");
    } else {
      showToast.info("Email is still not verified.");
    }
  }

  if (lines.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted mb-3">Nothing to checkout.</p>
        <Link to="/menu" className="btn btn-primary">
          Browse menu
        </Link>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <h1 className="h3 mb-4" style={{ color: "var(--primary-dark)" }}>
          Checkout
        </h1>
        <p className="small text-muted mb-4">
          Totals are confirmed on the server when you submit — prices always come
          from our catalog.
        </p>
        {!emailVerified ? (
          <div className="alert alert-warning small d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span>
              Verify your email before placing an order.
            </span>
            <span className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={handleResendVerification}
              >
                Resend link
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={handleCheckVerification}
              >
                I verified
              </button>
            </span>
          </div>
        ) : null}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h2 className="h6 mb-3">Order summary</h2>
            <ul className="list-unstyled small mb-0">
              {lines.map((l) => (
                <li
                  key={l.variantId}
                  className="d-flex justify-content-between py-1 border-bottom"
                >
                  <span>
                    {l.productName} · {l.variantLabel} × {l.quantity}
                  </span>
                  <span>
                    ₱{(l.unitPrice * l.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
              <li className="d-flex justify-content-between pt-2">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </li>
              {form.fulfillment_type === "delivery" ? (
                <li className="d-flex justify-content-between">
                  <span>Delivery fee</span>
                  <span>₱{deliveryFee.toFixed(2)}</span>
                </li>
              ) : null}
              <li className="d-flex justify-content-between fw-bold pt-2">
                <span>Total</span>
                <span className="text-brand">₱{grand.toFixed(2)}</span>
              </li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name *</label>
                <input
                  className="form-control"
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone *</label>
                <input
                  className="form-control"
                  value={form.customer_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_phone: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label">Email (optional)</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.customer_email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_email: e.target.value }))
                  }
                />
              </div>
              <div className="col-12">
                <label className="form-label d-block">Fulfillment *</label>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="ful-pickup"
                    checked={form.fulfillment_type === "pickup"}
                    onChange={() =>
                      setForm((f) => ({ ...f, fulfillment_type: "pickup" }))
                    }
                  />
                  <label className="form-check-label" htmlFor="ful-pickup">
                    Pickup
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="ful-del"
                    checked={form.fulfillment_type === "delivery"}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        fulfillment_type: "delivery",
                      }))
                    }
                  />
                  <label className="form-check-label" htmlFor="ful-del">
                    Delivery (+₱{DELIVERY_FEE_FLAT.toFixed(2)})
                  </label>
                </div>
              </div>
              {form.fulfillment_type === "delivery" ? (
                <div className="col-12">
                  <label className="form-label">Delivery address *</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.delivery_address}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        delivery_address: e.target.value,
                      }))
                    }
                    required={form.fulfillment_type === "delivery"}
                  />
                </div>
              ) : null}
              <div className="col-12">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Allergies, preferred time, etc."
                />
              </div>
            </div>
          </div>
          <div className="card-footer bg-white border-top d-flex gap-2 flex-wrap">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !emailVerified}
            >
              {submitting ? "Placing order…" : "Place order"}
            </button>
            <Link to="/cart" className="btn btn-outline-secondary">
              Back to cart
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
