import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../services/notificationService";
import {
  ADMIN_LOGIN_PATH,
  getHomePathForUser,
  isAdminUser,
} from "../../utils/authRouting";
import { useAuthContext } from "../../contexts/AuthContext";
import { setAuthToken } from "../../lib/api";
import LoginBackground from "../../assets/background_image.png";
import Logo from "../../assets/logo.png";
import PortalModal from "../../components/PortalModal";
import "./Login.css";

const REJECTION_STORAGE_KEY = "ajfitness_login_rejection";
const DEACTIVATION_STORAGE_KEY = "ajfitness_login_deactivated";

/** Reserve space for fixed footer (ATIn-client layout). */
const FOOTER_HEIGHT_PX = 60;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountStatusModal, setAccountStatusModal] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();
  const { user, loading, setUser } = useAuthContext();

  const theme = {
    primary: "#8cc63f",
    primaryDark: "#6ba82e",
    textPrimary: "#1e293b",
    textSecondary: "#475569",
    backgroundLight: "#f8fafc",
    backgroundWhite: "#ffffff",
    borderColor: "#e2e8f0",
  };

  useEffect(() => {
    if (!loading && user) {
      navigate(getHomePathForUser(user), { replace: true });
    }
  }, [loading, user, navigate]);

  const closeAccountStatusModal = useCallback(
    () => setAccountStatusModal(null),
    [],
  );

  useEffect(() => {
    try {
      const rejectionRaw = sessionStorage.getItem(REJECTION_STORAGE_KEY);
      if (rejectionRaw) {
        sessionStorage.removeItem(REJECTION_STORAGE_KEY);
        const data = JSON.parse(rejectionRaw);
        setAccountStatusModal({
          type: "rejected",
          remarks: data?.rejection_remarks ?? data?.rejectionRemarks ?? null,
        });
        return;
      }
      const deactivationRaw = sessionStorage.getItem(DEACTIVATION_STORAGE_KEY);
      if (deactivationRaw) {
        sessionStorage.removeItem(DEACTIVATION_STORAGE_KEY);
        try {
          const data = JSON.parse(deactivationRaw);
          setAccountStatusModal({
            type: "deactivated",
            remarks:
              data?.deactivation_remarks ?? data.deactivationRemarks ?? null,
          });
        } catch {
          setAccountStatusModal({ type: "deactivated", remarks: null });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = LoginBackground;
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("login-page-active");
    document.body.classList.add("login-page-active");
    return () => {
      document.documentElement.classList.remove("login-page-active");
      document.body.classList.remove("login-page-active");
    };
  }, []);

  useEffect(() => {
    if (!accountStatusModal) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeAccountStatusModal();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [accountStatusModal, closeAccountStatusModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      showToast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(form.email, form.password);

      if (result.success) {
        if (!isAdminUser(result.user)) {
          setAuthToken(null);
          setUser(null);
          showToast.error(
            "This account does not have access to the admin dashboard.",
          );
          setIsSubmitting(false);
          setTimeout(() => navigate("/", { replace: true }), 400);
          return;
        }
        showToast.success(`Welcome back, ${result.user?.name ?? "friend"}!`);
        setTimeout(() => {
          const from = location.state?.from;
          const fallback = getHomePathForUser(result.user);
          const fromPath =
            from &&
            typeof from.pathname === "string" &&
            from.pathname.startsWith("/admin") &&
            from.pathname !== ADMIN_LOGIN_PATH
              ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
              : null;
          navigate(fromPath ?? fallback, { replace: true });
        }, 1500);
      } else {
        if (
          result.httpStatus === 403 &&
          (result.accountStatus === "deactivated" ||
            result.accountStatus === "rejected")
        ) {
          const type =
            result.accountStatus === "deactivated" ? "deactivated" : "rejected";
          let remarks =
            type === "deactivated"
              ? (result.deactivation_remarks ?? null)
              : (result.rejection_remarks ?? null);
          if (!remarks && result.error && result.error.includes(" Reason: ")) {
            const parts = result.error.split(" Reason: ");
            remarks = parts[1] ? parts[1].trim() : null;
          }
          setAccountStatusModal({ type, remarks: remarks || null });
        } else {
          showToast.error(
            result.error ||
              "Invalid credentials. Please check your email and password.",
          );
        }
      }
    } catch (error) {
      showToast.error(
        "Unable to connect to the server. Please check your internet connection and try again.",
      );
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      id="login-page"
      className="d-flex flex-column position-relative login-page-root"
      style={{
        height: "100dvh",
        minHeight: "100vh",
        maxHeight: "-webkit-fill-available",
        overflow: "hidden",
        boxSizing: "border-box",
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingTop: 0,
        paddingBottom: FOOTER_HEIGHT_PX,
        zIndex: 1,
      }}
    >
      <div
        className="position-fixed"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${LoginBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: theme.backgroundLight,
          zIndex: 0,
          pointerEvents: "none",
        }}
        aria-hidden
      />

      <div
        className="flex-grow-1 d-flex align-items-center justify-content-center position-relative min-h-0"
        style={{ zIndex: 1 }}
      >
        <div
          className="bg-white rounded-4 shadow-lg position-relative login-card-enter p-4 p-sm-5 w-100"
          style={{
            maxWidth: "440px",
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          <div className="text-center mb-4 w-100">
            <div className="d-flex align-items-center justify-content-center mx-auto">
              <img
                src={Logo}
                alt="AJ Fitness Cafe Pagadian"
                className="img-fluid login-branding-fade-in"
                style={{
                  maxWidth: "min(100%, 320px)",
                  maxHeight: "140px",
                  width: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>

          <h5
            className="text-center fw-bolder fs-5 mb-4 login-title-fade-in"
            style={{ color: theme.primaryDark }}
          >
            Log in to your account
          </h5>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="email"
              className="mb-1 fw-semibold"
              style={{ fontSize: ".9rem", color: theme.textSecondary }}
            >
              Email
            </label>
            <div className="mb-3 position-relative">
              <FaEnvelope
                className="position-absolute top-50 translate-middle-y text-muted ms-3"
                size={16}
              />
              <input
                type="email"
                name="email"
                id="email"
                className="form-control ps-5 fw-semibold login-input"
                placeholder="Email"
                value={form.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                autoComplete="email"
                style={{
                  backgroundColor: "var(--input-bg)",
                  color: "var(--input-text)",
                  border: "1px solid var(--input-border)",
                }}
              />
            </div>

            <label
              htmlFor="password"
              className="mb-1 fw-semibold"
              style={{ fontSize: ".9rem", color: theme.textSecondary }}
            >
              Password
            </label>
            <div className="mb-3 position-relative">
              <FaLock
                className="position-absolute top-50 translate-middle-y text-muted ms-3"
                size={16}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                className="form-control ps-5 pe-5 fw-semibold login-input"
                placeholder="Password"
                value={form.password}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                autoComplete="current-password"
                style={{
                  backgroundColor: "var(--input-bg)",
                  color: "var(--input-text)",
                  border: "1px solid var(--input-border)",
                }}
              />
              <span
                onClick={() =>
                  !isSubmitting && setShowPassword(!showPassword)
                }
                className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted"
                style={{ cursor: isSubmitting ? "not-allowed" : "pointer" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!isSubmitting) setShowPassword((prev) => !prev);
                  }
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button
              type="submit"
              className="login-signin-btn w-100 py-2 fw-semibold d-flex align-items-center justify-content-center border-0"
              disabled={isSubmitting}
              style={{
                "--signin-bg": theme.primary,
                "--signin-bg-hover": theme.primaryDark,
                color: "#ffffff",
                borderRadius: "8px",
                border: `1px solid ${theme.primaryDark}`,
              }}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="spinner me-2" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>

      <PortalModal
        isOpen={Boolean(accountStatusModal)}
        onRequestClose={closeAccountStatusModal}
        role="alertdialog"
        ariaLabelledby="login-account-status-title"
        ariaDescribedby="login-account-status-desc"
        overlayClassName="account-approvals-detail-overlay"
        backdropClassName="account-approvals-detail-backdrop"
        wrapClassName=""
        panelClassName="account-approvals-detail-modal login-status-modal"
      >
        {accountStatusModal ? (
          <>
            <div className="account-approvals-detail-header">
              <div className="account-approvals-detail-header-text">
                <h5
                  id="login-account-status-title"
                  className="mb-0 fw-semibold"
                >
                  {accountStatusModal.type === "deactivated"
                    ? "Account deactivated"
                    : "Account rejected"}
                </h5>
                <div
                  id="login-account-status-desc"
                  className="account-approvals-detail-subtitle"
                >
                  <span className="account-approvals-detail-name">
                    {accountStatusModal.type === "deactivated"
                      ? "Your account has been deactivated by an administrator. You are not permitted to sign in until your account is reactivated."
                      : "Your account has been rejected. You are not permitted to sign in."}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-custom"
                aria-label="Close"
                onClick={closeAccountStatusModal}
              >
                ×
              </button>
            </div>

            <div className="account-approvals-detail-body">
              <p className="account-approvals-action-help mb-3">
                {accountStatusModal.type === "deactivated"
                  ? "Your account has been deactivated. Please contact your administrator for assistance or to request reactivation."
                  : "Your registration has been reviewed and was not approved. You do not have access to this system."}
              </p>
              <div className="border-top pt-3">
                <p className="mb-2 small fw-semibold text-uppercase text-muted">
                  Remarks from administrator
                </p>
                {accountStatusModal.remarks ? (
                  <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                    {accountStatusModal.remarks}
                  </p>
                ) : (
                  <p className="mb-0 fst-italic text-muted">
                    No additional remarks provided.
                  </p>
                )}
              </div>
            </div>

            <div className="account-approvals-detail-footer">
              <button
                type="button"
                className="btn btn-light account-approvals-detail-close-btn"
                onClick={closeAccountStatusModal}
              >
                Close
              </button>
            </div>
          </>
        ) : null}
      </PortalModal>

      <footer
        className="login-page-footer position-fixed bottom-0 start-0 w-100"
        style={{ zIndex: 1 }}
        role="contentinfo"
      >
        <div className="login-page-footer-inner">
          <p className="login-page-footer-name">AJ Fitness Cafe Pagadian</p>
          <p className="login-page-footer-tagline">
            Fresh juices, smoothies, and cafe drinks
          </p>
          <p className="login-page-footer-copy">
            © {new Date().getFullYear()} AJ Fitness Cafe Pagadian. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
