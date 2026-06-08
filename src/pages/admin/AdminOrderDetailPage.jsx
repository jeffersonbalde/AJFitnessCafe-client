import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  fetchAdminOrder,
  patchAdminOrder,
  postAssignOrderCustomer,
  reconcileAdminOrderPayment,
} from "../../api/admin/orders";
import { postAdminRefund } from "../../api/admin/payments";
import { useAuthContext } from "../../contexts/AuthContext";
import { hasPermission } from "../../utils/authRouting";
import { showToast } from "../../services/notificationService";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

function normalizeOrder(res) {
  const raw = res?.data;
  if (!raw) return null;
  return raw.data !== undefined ? raw.data : raw;
}

function formatError(err) {
  const msg =
    err?.response?.data?.message ||
    err?.response?.data?.errors ||
    err?.message;
  if (typeof msg === "string") return msg;
  if (msg && typeof msg === "object") {
    return Object.values(msg)
      .flat()
      .filter(Boolean)
      .join(" ");
  }
  return "Something went wrong.";
}

const ACTION_LABELS = {
  preparing: "Start preparing",
  ready: "Mark ready (pickup or before dispatch)",
  out_for_delivery: "Out for delivery",
  completed: "Mark completed",
  cancelled: "Cancel order",
};

function statusBadgeClass(status) {
  switch (status) {
    case "paid":
      return "success";
    case "preparing":
      return "primary";
    case "ready":
      return "info";
    case "out_for_delivery":
      return "info";
    case "completed":
      return "secondary";
    case "cancelled":
    case "payment_failed":
    case "payment_expired":
      return "dark";
    case "pending_payment":
    case "authorized":
      return "warning";
    default:
      return "light";
  }
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: adminUser } = useAuthContext();
  const canEditCustomers = hasPermission(adminUser, "customers.update");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchAdminOrder(id);
      const o = normalizeOrder(res);
      setOrder(o);
      setAdminNote(o?.admin_note ?? "");
    } catch (err) {
      showToast.error(formatError(err));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const allowed = useMemo(
    () =>
      Array.isArray(order?.allowed_next_statuses)
        ? order.allowed_next_statuses
        : [],
    [order?.allowed_next_statuses],
  );

  async function applyStatus(nextStatus) {
    if (!order || !id) return;
    setSaving(true);
    try {
      const res = await patchAdminOrder(id, {
        status: nextStatus,
        admin_note: adminNote.trim() || null,
      });
      const o = normalizeOrder(res);
      setOrder(o);
      setAdminNote(o?.admin_note ?? "");
      showToast.success("Order updated.");
    } catch (err) {
      showToast.error(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveNoteOnly() {
    if (!order || !id) return;
    setSaving(true);
    try {
      const res = await patchAdminOrder(id, {
        admin_note: adminNote.trim() || null,
      });
      const o = normalizeOrder(res);
      setOrder(o);
      setAdminNote(o?.admin_note ?? "");
      showToast.success("Note saved.");
    } catch (err) {
      showToast.error(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  async function reconcilePaymentNow() {
    if (!id) return;
    setReconciling(true);
    try {
      const res = await reconcileAdminOrderPayment(id);
      const o = normalizeOrder(res);
      setOrder(o);
      showToast.success("Payment status reconciled.");
    } catch (err) {
      showToast.error(formatError(err));
    } finally {
      setReconciling(false);
    }
  }

  async function linkToCustomer() {
    if (!order || !id) return;
    const uid = String(assignUserId).trim();
    if (!/^\d+$/.test(uid)) {
      showToast.error("Enter the numeric customer user id from Customers.");
      return;
    }
    setAssigning(true);
    try {
      const res = await postAssignOrderCustomer(id, { user_id: Number(uid) });
      const o = normalizeOrder(res);
      setOrder(o);
      setAssignUserId("");
      showToast.success("Order linked to customer account.");
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 422 && data?.email_mismatch) {
        const ok = window.confirm(
          `${data.message || "Email mismatch."} Link anyway?`,
        );
        if (ok) {
          try {
            const res2 = await postAssignOrderCustomer(id, {
              user_id: Number(uid),
              confirm_email_mismatch: true,
            });
            const o2 = normalizeOrder(res2);
            setOrder(o2);
            setAssignUserId("");
            showToast.success("Order linked to customer account.");
          } catch (err2) {
            showToast.error(formatError(err2));
          }
        }
      } else {
        showToast.error(formatError(err));
      }
    } finally {
      setAssigning(false);
    }
  }

  async function submitRefund() {
    if (!id) return;
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast.error("Enter a valid refund amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await postAdminRefund(id, {
        amount,
        note: refundNote.trim() || null,
      });
      const o = normalizeOrder(res);
      setOrder(o);
      setRefundAmount("");
      setRefundNote("");
      showToast.success("Refund recorded.");
    } catch (err) {
      showToast.error(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminPageShell title="Order" subtitle="Loading…">
        <p className="text-muted py-4">Loading order…</p>
      </AdminPageShell>
    );
  }

  if (!order) {
    return (
      <AdminPageShell title="Order" subtitle="Not found">
        <p className="text-muted">This order could not be loaded.</p>
        <Link to="/admin/orders" className="btn btn-outline-secondary">
          Back to orders
        </Link>
      </AdminPageShell>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const badge = statusBadgeClass(order.status);

  return (
    <AdminPageShell
      iconClassName="fas fa-file-invoice"
      title={order.order_number}
      subtitle={`Placed ${order.created_at ? new Date(order.created_at).toLocaleString() : "—"}`}
      headerActions={
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate("/admin/orders")}
        >
          ← All orders
        </button>
      }
    >
      <div className="row g-3">
        <div className="col-lg-4">
          <div
            className="rounded-3 p-3 h-100"
            style={{ backgroundColor: "#ffffff", border: T.cardBorder }}
          >
            <h3
              className="h6 mb-3"
              style={{ fontFamily: T.interFamily, color: T.titleColor }}
            >
              Status
            </h3>
            <p className="mb-2">
              <span className={`badge text-bg-${badge}`}>
                {String(order.status || "").replace(/_/g, " ")}
              </span>
            </p>
            <p className="small text-muted mb-3">
              Use the actions below to move the order through your kitchen /
              pickup workflow.
            </p>
            <div className="d-flex flex-column gap-2">
              {allowed.map((st) => (
                <button
                  key={st}
                  type="button"
                  className={
                    st === "cancelled"
                      ? "btn btn-outline-danger"
                      : "btn btn-primary"
                  }
                  style={
                    st === "cancelled"
                      ? {}
                      : { backgroundColor: T.primaryGreen, border: "none" }
                  }
                  disabled={saving}
                  onClick={() => applyStatus(st)}
                >
                  {ACTION_LABELS[st] ?? st.replace(/_/g, " ")}
                </button>
              ))}
              {allowed.length === 0 ? (
                <p className="small text-muted mb-0">
                  No status changes available for this state.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div
            className="rounded-3 p-3 mb-3"
            style={{ backgroundColor: "#ffffff", border: T.cardBorder }}
          >
            <h3
              className="h6 mb-3"
              style={{ fontFamily: T.interFamily, color: T.titleColor }}
            >
              Customer
            </h3>
            <dl className="row small mb-0">
              <dt className="col-sm-3 text-muted">Name</dt>
              <dd className="col-sm-9">{order.customer_name}</dd>
              <dt className="col-sm-3 text-muted">Phone</dt>
              <dd className="col-sm-9">{order.customer_phone}</dd>
              <dt className="col-sm-3 text-muted">Email</dt>
              <dd className="col-sm-9">{order.customer_email || "—"}</dd>
              <dt className="col-sm-3 text-muted">Type</dt>
              <dd className="col-sm-9 text-capitalize">
                {order.fulfillment_type}
              </dd>
              {order.fulfillment_type === "delivery" &&
              order.delivery_address ? (
                <>
                  <dt className="col-sm-3 text-muted">Address</dt>
                  <dd className="col-sm-9">{order.delivery_address}</dd>
                </>
              ) : null}
              {order.notes ? (
                <>
                  <dt className="col-sm-3 text-muted">Customer notes</dt>
                  <dd className="col-sm-9">{order.notes}</dd>
                </>
              ) : null}
              {order.user_id != null ? (
                <>
                  <dt className="col-sm-3 text-muted">Linked account</dt>
                  <dd className="col-sm-9">
                    <Link
                      to={`/admin/customers/${order.user_id}`}
                      style={{ color: T.primaryGreen }}
                    >
                      Customer #{order.user_id}
                    </Link>
                  </dd>
                </>
              ) : null}
            </dl>
            {canEditCustomers && order.user_id == null ? (
              <div className="mt-3 pt-3 border-top small">
                <div className="fw-semibold mb-2">Link to registered customer</div>
                <p className="text-muted mb-2">
                  Guest checkout — assign a storefront account id so this order appears on
                  their customer profile. Emails must match unless you confirm.
                </p>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <input
                    className="form-control form-control-sm"
                    style={{ maxWidth: "11rem" }}
                    placeholder="Customer user id"
                    inputMode="numeric"
                    value={assignUserId}
                    onChange={(e) =>
                      setAssignUserId(e.target.value.replace(/\D/g, ""))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    disabled={assigning}
                    onClick={linkToCustomer}
                  >
                    {assigning ? "Linking…" : "Link account"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="rounded-3 p-3 mb-3"
            style={{ backgroundColor: "#ffffff", border: T.cardBorder }}
          >
            <h3
              className="h6 mb-3"
              style={{ fontFamily: T.interFamily, color: T.titleColor }}
            >
              Payment (Maya / method)
            </h3>
            <dl className="row small mb-0">
              <dt className="col-sm-3 text-muted">Method</dt>
              <dd className="col-sm-9">
                {order.payment_method
                  ? String(order.payment_method).replace(/_/g, " ")
                  : "—"}
              </dd>
              <dt className="col-sm-3 text-muted">Maya status</dt>
              <dd className="col-sm-9">
                {order.maya_payment_status || "—"}
              </dd>
              <dt className="col-sm-3 text-muted">Checkout ID</dt>
              <dd className="col-sm-9 text-break">
                <code className="small">{order.maya_checkout_id || "—"}</code>
              </dd>
              <dt className="col-sm-3 text-muted">Payment ID</dt>
              <dd className="col-sm-9 text-break">
                <code className="small">{order.maya_payment_id || "—"}</code>
              </dd>
              <dt className="col-sm-3 text-muted">Reconcile</dt>
              <dd className="col-sm-9">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={reconcilePaymentNow}
                  disabled={reconciling || saving}
                >
                  {reconciling ? "Reconciling…" : "Reconcile with Maya"}
                </button>
              </dd>
              <dt className="col-sm-3 text-muted">Receipt emailed</dt>
              <dd className="col-sm-9">
                {order.receipt_sent_at
                  ? new Date(order.receipt_sent_at).toLocaleString()
                  : "—"}
              </dd>
              <dt className="col-sm-3 text-muted">Ready email sent</dt>
              <dd className="col-sm-9">
                {order.notified_ready_at
                  ? new Date(order.notified_ready_at).toLocaleString()
                  : "—"}
              </dd>
              <dt className="col-sm-3 text-muted">On the way email sent</dt>
              <dd className="col-sm-9">
                {order.notified_out_for_delivery_at
                  ? new Date(order.notified_out_for_delivery_at).toLocaleString()
                  : "—"}
              </dd>
              <dt className="col-sm-3 text-muted">Refund status</dt>
              <dd className="col-sm-9">{order.refund_status || "—"}</dd>
              <dt className="col-sm-3 text-muted">Refunded amount</dt>
              <dd className="col-sm-9">₱{Number(order.refunded_amount || 0).toFixed(2)}</dd>
            </dl>
            <div className="border-top pt-3 mt-3">
              <p className="small text-muted mb-2">Record manual/verified refund action:</p>
              <div className="d-flex flex-wrap gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="form-control form-control-sm"
                  style={{ maxWidth: 160 }}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Amount"
                />
                <input
                  className="form-control form-control-sm"
                  style={{ minWidth: 220, maxWidth: 360 }}
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="Refund note (optional)"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={saving}
                  onClick={submitRefund}
                >
                  Record refund
                </button>
              </div>
            </div>
          </div>

          <div
            className="rounded-3 p-3 mb-3"
            style={{ backgroundColor: "#ffffff", border: T.cardBorder }}
          >
            <h3
              className="h6 mb-3"
              style={{ fontFamily: T.interFamily, color: T.titleColor }}
            >
              Payment events
            </h3>
            {Array.isArray(order.payment_events) && order.payment_events.length > 0 ? (
              <ul className="small mb-0">
                {order.payment_events.map((ev) => (
                  <li key={ev.id} className="mb-1">
                    <code>{ev.source}</code> - {ev.provider_status || "—"}{" "}
                    {ev.provider_payment_id ? `(${ev.provider_payment_id})` : ""}
                    {ev.created_at ? ` at ${new Date(ev.created_at).toLocaleString()}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small text-muted mb-0">No payment events yet.</p>
            )}
          </div>

          <div
            className="rounded-3 p-3 mb-3"
            style={{ backgroundColor: "#ffffff", border: T.cardBorder }}
          >
            <h3
              className="h6 mb-3"
              style={{ fontFamily: T.interFamily, color: T.titleColor }}
            >
              Internal note
            </h3>
            <p className="small text-muted">
              Staff-only note. It is saved with the order and included when you
              change status (optional).
            </p>
            <textarea
              className="form-control form-control-sm mb-2"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              disabled={saving}
              placeholder="e.g. Customer called — allergy to nuts"
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={saving}
              onClick={saveNoteOnly}
            >
              Save note only
            </button>
          </div>

          <div
            className="rounded-3 overflow-hidden"
            style={{ backgroundColor: "#ffffff", border: T.cardBorder }}
          >
            <div
              className="px-3 py-2"
              style={{
                backgroundColor: T.toolbarBg,
                borderBottom: "1px solid #e5e7eb",
                fontFamily: T.interFamily,
                fontWeight: 700,
                fontSize: "0.85rem",
                color: T.titleColor,
              }}
            >
              Line items
            </div>
            <div className="table-responsive">
              <table className="table table-sm mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Product</th>
                    <th className="text-end">Qty</th>
                    <th className="text-end">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted py-3 text-center">
                        No items.
                      </td>
                    </tr>
                  ) : (
                    items.map((line) => (
                      <tr key={line.id ?? `${line.product_variant_id}-${line.variant_label}`}>
                        <td>
                          {line.product_name}
                          {line.variant_label ? (
                            <span className="text-muted">
                              {" "}
                              · {line.variant_label}
                            </span>
                          ) : null}
                        </td>
                        <td className="text-end">{line.quantity}</td>
                        <td className="text-end">
                          ₱{Number(line.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={2} className="text-end small">
                      Subtotal
                    </td>
                    <td className="text-end fw-semibold">
                      ₱{Number(order.subtotal).toFixed(2)}
                    </td>
                  </tr>
                  {Number(order.delivery_fee) > 0 ? (
                    <tr>
                      <td colSpan={2} className="text-end small">
                        Delivery
                      </td>
                      <td className="text-end">
                        ₱{Number(order.delivery_fee).toFixed(2)}
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td colSpan={2} className="text-end fw-semibold">
                      Grand total
                    </td>
                    <td className="text-end fw-bold">
                      ₱{Number(order.grand_total).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}
