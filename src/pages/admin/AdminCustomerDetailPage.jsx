import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchAdminCustomer,
  patchAdminCustomer,
  postAdminCustomerPasswordReset,
  postAdminCustomerTempPassword,
} from "../../api/admin/customers";
import { postAssignOrderCustomer } from "../../api/admin/orders";
import { showToast } from "../../services/notificationService";
import { useAuthContext } from "../../contexts/AuthContext";
import { hasPermission } from "../../utils/authRouting";
import AdminPageShell from "./AdminPageShell";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

function statusBadgeClass(status) {
  switch (status) {
    case "paid":
      return "success";
    case "preparing":
      return "primary";
    case "ready":
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

function tagsFromInput(s) {
  return Array.from(
    new Set(
      String(s || "")
        .split(/[,\n]+/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const { user: adminUser } = useAuthContext();
  const canEdit = hasPermission(adminUser, "customers.update");

  const [customer, setCustomer] = useState(null);
  const [purchaseSummary, setPurchaseSummary] = useState([]);
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [segment, setSegment] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [suspended, setSuspended] = useState(false);

  const [tempPw, setTempPw] = useState("");
  const [tempPwConf, setTempPwConf] = useState("");
  const [linkOrderId, setLinkOrderId] = useState("");

  const hydrateForms = useCallback((c) => {
    if (!c) return;
    setName(c.name ?? "");
    setEmail(c.email ?? "");
    setPhone(c.phone ?? "");
    setSegment(c.customer_segment ?? "");
    setTagsInput(Array.isArray(c.customer_tags) ? c.customer_tags.join(", ") : "");
    setInternalNote(c.admin_customer_note ?? "");
    setEmailVerified(Boolean(c.email_verified_at));
    setSuspended(Boolean(c.is_suspended));
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchAdminCustomer(id, { page, per_page: 15 });
      const body = res.data ?? {};
      const c = body.customer ?? null;
      setCustomer(c);
      hydrateForms(c);
      setPurchaseSummary(Array.isArray(body.purchase_summary) ? body.purchase_summary : []);
      setOrders(Array.isArray(body.orders) ? body.orders : []);
      const m = body.orders_meta;
      setMeta({
        current_page: m?.current_page ?? page,
        last_page: m?.last_page ?? 1,
        per_page: m?.per_page ?? 15,
        total: m?.total ?? 0,
      });
    } catch {
      showToast.error("Failed to load customer.");
      setCustomer(null);
      setPurchaseSummary([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [id, page, hydrateForms]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [id]);

  async function saveProfile(e) {
    e.preventDefault();
    if (!id || !canEdit) return;
    setSaving(true);
    try {
      const res = await patchAdminCustomer(id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        customer_segment: segment.trim() || null,
        customer_tags: tagsFromInput(tagsInput),
        admin_customer_note: internalNote.trim() || null,
        email_verified: emailVerified,
        suspended,
      });
      const c = res.data?.customer ?? null;
      if (c) {
        setCustomer(c);
        hydrateForms(c);
      }
      showToast.success("Customer updated.");
    } catch (err) {
      showToast.error(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  async function sendPasswordResetEmail() {
    if (!id || !canEdit) return;
    try {
      await postAdminCustomerPasswordReset(id);
      showToast.success("Password reset email sent.");
    } catch (err) {
      showToast.error(formatError(err));
    }
  }

  async function applyTempPassword(e) {
    e.preventDefault();
    if (!id || !canEdit) return;
    if (tempPw !== tempPwConf) {
      showToast.error("Passwords do not match.");
      return;
    }
    try {
      await postAdminCustomerTempPassword(id, {
        password: tempPw,
        password_confirmation: tempPwConf,
      });
      setTempPw("");
      setTempPwConf("");
      showToast.success("Temporary password set.");
    } catch (err) {
      showToast.error(formatError(err));
    }
  }

  async function linkOrderToCustomer() {
    if (!id || !canEdit) return;
    const oid = String(linkOrderId).trim();
    if (!/^\d+$/.test(oid)) {
      showToast.error("Enter a numeric order id (from the admin order URL).");
      return;
    }
    try {
      await postAssignOrderCustomer(oid, { user_id: Number(id) });
      setLinkOrderId("");
      showToast.success("Order linked to this customer.");
      load();
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 422 && data?.email_mismatch) {
        const ok = window.confirm(
          `${data.message || "Email mismatch."} Link this order anyway?`,
        );
        if (ok) {
          try {
            await postAssignOrderCustomer(oid, {
              user_id: Number(id),
              confirm_email_mismatch: true,
            });
            setLinkOrderId("");
            showToast.success("Order linked to this customer.");
            load();
          } catch (err2) {
            showToast.error(formatError(err2));
          }
        }
      } else {
        showToast.error(formatError(err));
      }
    }
  }

  const { current_page: curPage, last_page: lastPage, total } = meta;
  const hasPrev = curPage > 1;
  const hasNext = curPage < lastPage;
  const googleOnly = Boolean(customer?.signed_up_with_google);

  if (!loading && !customer) {
    return (
      <AdminPageShell
        iconClassName="fas fa-user-slash"
        title="Customer"
        subtitle="This account could not be found."
      >
        <p className="text-muted mb-0">
          <Link to="/admin/customers">Back to customers</Link>
        </p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      iconClassName="fas fa-user"
      title={customer?.name || "Customer"}
      subtitle={customer?.email || ""}
      headerActions={
        <div className="d-flex flex-wrap gap-2">
          <Link
            to={`/admin/orders?user_id=${encodeURIComponent(id)}`}
            className="btn btn-sm btn-outline-success"
          >
            All orders (filtered)
          </Link>
          <Link to="/admin/customers" className="btn btn-sm btn-outline-secondary">
            Back to list
          </Link>
        </div>
      }
    >
      {loading || !customer ? (
        <p className="text-muted py-4 text-center mb-0">Loading…</p>
      ) : (
        <>
          <div
            className="row g-3 mb-4"
            style={{ fontFamily: T.interFamily }}
          >
            <div className="col-6 col-md-3">
              <div
                className="rounded-3 p-3 h-100"
                style={{ backgroundColor: "#fff", border: T.cardBorder }}
              >
                <div className="small text-muted">Account</div>
                <div className="fw-semibold">
                  {customer.is_suspended ? (
                    <span className="text-danger">Suspended</span>
                  ) : (
                    <span className="text-success">Active</span>
                  )}
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className="rounded-3 p-3 h-100"
                style={{ backgroundColor: "#fff", border: T.cardBorder }}
              >
                <div className="small text-muted">Orders</div>
                <div className="fw-semibold">{customer.orders_count ?? 0}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className="rounded-3 p-3 h-100"
                style={{ backgroundColor: "#fff", border: T.cardBorder }}
              >
                <div className="small text-muted">Lifetime total</div>
                <div className="fw-semibold font-monospace">
                  {customer.orders_total_ex_cancelled ?? "0.00"}
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className="rounded-3 p-3 h-100"
                style={{ backgroundColor: "#fff", border: T.cardBorder }}
              >
                <div className="small text-muted">Last order</div>
                <div className="fw-semibold small">
                  {customer.last_order_at
                    ? new Date(customer.last_order_at).toLocaleString()
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {canEdit ? (
            <form
              onSubmit={saveProfile}
              className="rounded-3 p-3 mb-4"
              style={{ backgroundColor: "#fff", border: T.cardBorder }}
            >
              <h3
                className="h6 mb-3"
                style={{ fontFamily: T.interFamily, color: T.titleColor }}
              >
                Profile & access
              </h3>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small text-muted">Name</label>
                  <input
                    className="form-control form-control-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted">Email</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted">Phone</label>
                  <input
                    className="form-control form-control-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted">Group / segment</label>
                  <input
                    className="form-control form-control-sm"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    placeholder="e.g. VIP, Corporate"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small text-muted">Tags (comma-separated)</label>
                  <input
                    className="form-control form-control-sm"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="vip, athlete, staff-pick"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small text-muted">Internal note (staff only)</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={3}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Allergies, VIP handling, do-not-serve, etc."
                  />
                </div>
                <div className="col-md-6 d-flex align-items-center gap-2 pt-2">
                  <input
                    id="cust-email-verified"
                    type="checkbox"
                    className="form-check-input"
                    checked={emailVerified}
                    onChange={(e) => setEmailVerified(e.target.checked)}
                  />
                  <label htmlFor="cust-email-verified" className="form-check-label small mb-0">
                    Email verified (support override)
                  </label>
                </div>
                <div className="col-md-6 d-flex align-items-center gap-2 pt-2">
                  <input
                    id="cust-suspended"
                    type="checkbox"
                    className="form-check-input"
                    checked={suspended}
                    onChange={(e) => setSuspended(e.target.checked)}
                  />
                  <label htmlFor="cust-suspended" className="form-check-label small mb-0">
                    Suspend storefront access (login, checkout, account orders)
                  </label>
                </div>
                <div className="col-12 pt-2">
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    style={{ backgroundColor: T.primaryGreen, border: "none" }}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div
              className="rounded-3 p-3 mb-4 small text-muted"
              style={{ backgroundColor: "#fff", border: T.cardBorder }}
            >
              You can view this customer. Only owners and managers can edit profile,
              suspension, or passwords.
            </div>
          )}

          {canEdit ? (
            <div className="row g-3 mb-4">
              <div className="col-lg-6">
                <div
                  className="rounded-3 p-3 h-100"
                  style={{ backgroundColor: "#fff", border: T.cardBorder }}
                >
                  <h3
                    className="h6 mb-2"
                    style={{ fontFamily: T.interFamily, color: T.titleColor }}
                  >
                    Password help
                  </h3>
                  {googleOnly ? (
                    <p className="small text-muted mb-0">
                      This customer signs in with Google. Password reset and temporary
                      password do not apply.
                    </p>
                  ) : (
                    <>
                      <p className="small text-muted">
                        Send the standard reset email, or set a temporary password (min.
                        10 characters). Both actions sign the customer out everywhere.
                      </p>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary mb-3"
                        onClick={sendPasswordResetEmail}
                      >
                        Send password reset email
                      </button>
                      <form onSubmit={applyTempPassword} className="border-top pt-3">
                        <div className="small fw-semibold mb-2">Set temporary password</div>
                        <input
                          type="password"
                          className="form-control form-control-sm mb-2"
                          placeholder="New password"
                          autoComplete="new-password"
                          value={tempPw}
                          onChange={(e) => setTempPw(e.target.value)}
                        />
                        <input
                          type="password"
                          className="form-control form-control-sm mb-2"
                          placeholder="Confirm password"
                          autoComplete="new-password"
                          value={tempPwConf}
                          onChange={(e) => setTempPwConf(e.target.value)}
                        />
                        <button type="submit" className="btn btn-sm btn-outline-secondary">
                          Set temp password
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
              <div className="col-lg-6">
                <div
                  className="rounded-3 p-3 h-100"
                  style={{ backgroundColor: "#fff", border: T.cardBorder }}
                >
                  <h3
                    className="h6 mb-2"
                    style={{ fontFamily: T.interFamily, color: T.titleColor }}
                  >
                    Link guest order
                  </h3>
                  <p className="small text-muted">
                    Enter an admin order id for a guest checkout (no linked account). If
                    the order email does not match this account, you will be asked to
                    confirm.
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    <input
                      className="form-control form-control-sm"
                      style={{ maxWidth: "12rem" }}
                      inputMode="numeric"
                      placeholder="Order id"
                      value={linkOrderId}
                      onChange={(e) => setLinkOrderId(e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={linkOrderToCustomer}
                    >
                      Link order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className="rounded-3 overflow-hidden mb-4"
            style={{ border: T.cardBorder }}
          >
            <div
              className="px-3 py-2 small"
              style={{ backgroundColor: T.toolbarBg }}
            >
              Purchased products (rollup)
            </div>
            <div className="table-responsive">
              <table className="table table-sm mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th className="text-end">Qty</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseSummary.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-3 text-muted small">
                        No qualifying orders yet (cancelled / failed excluded).
                      </td>
                    </tr>
                  ) : (
                    purchaseSummary.map((row, idx) => (
                      <tr key={`${row.product_name}-${row.variant_label}-${idx}`}>
                        <td>{row.product_name}</td>
                        <td className="text-muted">{row.variant_label}</td>
                        <td className="text-end">{row.total_qty}</td>
                        <td className="text-end font-monospace small">
                          {row.total_spent}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3 overflow-hidden" style={{ border: T.cardBorder }}>
            <div
              className="px-3 py-2 d-flex justify-content-between small"
              style={{ backgroundColor: T.toolbarBg }}
            >
              <span>Orders</span>
              <span className="text-muted">{total} for this account</span>
            </div>
            <p className="small text-muted px-3 pt-2 mb-0">
              Guest orders appear here after you{" "}
              <strong>link</strong> them from this page or from the order detail screen.
            </p>
            <div className="table-responsive">
              <table className="table table-sm table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Reference</th>
                    <th className="text-end">Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Maya</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No orders for this account yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link
                            to={`/admin/orders/${o.id}`}
                            className="fw-semibold text-decoration-none"
                            style={{ color: T.primaryGreen }}
                          >
                            <code className="small text-dark">{o.order_number}</code>
                          </Link>
                        </td>
                        <td className="text-end font-monospace small">
                          {o.grand_total}
                        </td>
                        <td>
                          <span
                            className={`badge bg-${statusBadgeClass(o.status)}`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="small">
                          {o.payment_method || "—"}
                        </td>
                        <td className="small text-muted">
                          {o.maya_payment_status || "—"}
                        </td>
                        <td className="small text-muted">
                          {o.created_at
                            ? new Date(o.created_at).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {lastPage > 1 ? (
              <div
                className="d-flex justify-content-between align-items-center px-3 py-2 border-top small"
                style={{ backgroundColor: "#fafafa" }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="text-muted">
                  Page {curPage} of {lastPage}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
