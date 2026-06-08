import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaKey } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { useAuthContext } from "../../contexts/AuthContext";
import { showToast } from "../../services/notificationService";
import {
  ACCOUNT_REGISTER_PATH,
  navigateCloseAuthModal,
} from "../../utils/authRouting";
import Logo from "../../assets/logo.png";
import "./AccountAuthModal.css";

const RESEND_COOLDOWN_SEC = 60;

export default function AccountVerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuthContext();
  const { sendEmailOtpGuest, verifyEmailOtpGuest } = useAuth();
  const emailFromState =
    typeof location.state?.email === "string"
      ? location.state.email.trim()
      : "";
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user?.email_verified) {
      navigate("/account/orders", { replace: true });
      return;
    }
    if (!emailFromState) {
      navigate(ACCOUNT_REGISTER_PATH, {
        replace: true,
        state: {
          backgroundLocation:
            location.state?.backgroundLocation ?? { pathname: "/" },
        },
      });
    }
  }, [loading, user, emailFromState, navigate, location.state]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const t = window.setInterval(() => {
      setResendSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendSeconds]);

  function closeModal() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      navigateCloseAuthModal(navigate, location);
    }, 220);
  }

  function goBackToCreateAccount() {
    navigate(ACCOUNT_REGISTER_PATH, {
      replace: true,
      state: {
        backgroundLocation:
          location.state?.backgroundLocation ?? { pathname: "/" },
      },
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.replace(/\D/g, "");
    if (trimmed.length !== 6) {
      showToast.error("Enter the 6-digit code.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await verifyEmailOtpGuest(emailFromState, trimmed);
      if (!result.success) {
        showToast.error(result.error || "Invalid code.");
        return;
      }
      showToast.success("Email verified. You can continue.");
      navigate("/account/orders", { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendSeconds > 0 || resendBusy || !emailFromState) return;
    setResendBusy(true);
    try {
      const result = await sendEmailOtpGuest(emailFromState);
      if (!result.success) {
        showToast.error(result.error || "Could not resend code.");
        return;
      }
      showToast.success(result.message ?? "Check your inbox for a new code.");
      setResendSeconds(RESEND_COOLDOWN_SEC);
    } finally {
      setResendBusy(false);
    }
  }

  function onCodeChange(e) {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(v);
  }

  if (loading || !emailFromState || user?.email_verified) {
    return null;
  }

  return (
    <div
      className={`account-auth-shell${isOpen ? " open" : ""}${isClosing ? " closing" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="card account-auth-modal">
        <div className="card-body account-auth-body">
          <div className="account-auth-header mb-1">
            <div className="account-auth-brand">
              <img src={Logo} alt="" className="account-auth-brand-logo" />
              <span className="account-auth-brand-name">AJ Fitness Cafe</span>
            </div>
            <button
              type="button"
              className="account-auth-close"
              onClick={closeModal}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <h1 className="mb-1 account-auth-title">Verify your email</h1>
          <p className="account-auth-subtitle mb-3">
            We sent a 6-digit code to{" "}
            <strong className="text-body">{emailFromState}</strong>. Enter it
            below to activate your account.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="verify-otp">
                Verification code
              </label>
              <div className="position-relative">
                <FaKey
                  className="account-auth-field-icon"
                  size={15}
                  aria-hidden
                />
                <input
                  id="verify-otp"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="form-control account-login-input account-login-input--has-start-icon"
                  value={code}
                  onChange={onCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  disabled={submitting}
                  aria-invalid={code.length > 0 && code.length < 6}
                />
              </div>
            </div>
            <button
              type="submit"
              className="account-signin-btn w-100"
              disabled={submitting || code.replace(/\D/g, "").length !== 6}
            >
              {submitting ? "Verifying..." : "Verify email"}
            </button>
          </form>
          <p className="account-auth-bottom-copy mt-3 mb-0">
            <button
              type="button"
              className="btn btn-link p-0 account-auth-link border-0 align-baseline"
              style={{ fontSize: "inherit", verticalAlign: "baseline" }}
              onClick={handleResend}
              disabled={resendSeconds > 0 || resendBusy}
            >
              {resendSeconds > 0
                ? `Resend code (${resendSeconds}s)`
                : resendBusy
                  ? "Sending..."
                  : "Resend code"}
            </button>
          </p>
          <p className="account-auth-bottom-copy mb-0 mt-2">
            <button
              type="button"
              className="btn btn-link p-0 account-auth-link border-0 align-baseline"
              style={{ fontSize: "inherit", verticalAlign: "baseline" }}
              onClick={goBackToCreateAccount}
            >
              Back to Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
