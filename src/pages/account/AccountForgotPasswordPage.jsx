import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../services/notificationService";
import {
  ACCOUNT_LOGIN_PATH,
  ACCOUNT_VERIFY_EMAIL_PATH,
  navigateCloseAuthModal,
} from "../../utils/authRouting";
import "./AccountAuthModal.css";

export default function AccountForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  function closeModal() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      navigateCloseAuthModal(navigate, location);
    }, 220);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      showToast.error("Enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim());
      if (result.requiresEmailVerification) {
        showToast.info(result.error);
        navigate(ACCOUNT_VERIFY_EMAIL_PATH, {
          replace: true,
          state: {
            email: result.email ?? email.trim(),
            backgroundLocation:
              location.state?.backgroundLocation ?? { pathname: "/" },
          },
        });
        return;
      }
      if (result.useGoogleSignIn) {
        showToast.info(
          result.error ??
            "This account uses Google sign-in. Use the Google button on the login page.",
        );
        return;
      }
      if (!result.success) {
        showToast.error(result.error || "Could not send reset link.");
        return;
      }
      showToast.success(
        result.message ??
          "If an account exists for this email, a reset link has been sent.",
      );
      navigate(ACCOUNT_LOGIN_PATH, {
        replace: true,
        state: {
          backgroundLocation:
            location.state?.backgroundLocation ?? { pathname: "/" },
        },
      });
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="mb-0 account-auth-title">Reset password</h1>
            <button
              type="button"
              className="account-auth-close"
              onClick={closeModal}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="account-auth-subtitle mb-3">
            Enter your email to receive reset instructions.
          </p>
          <form onSubmit={onSubmit}>
            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="fp-email">
                Email
              </label>
              <div className="position-relative">
                <FaEnvelope
                  className="account-auth-field-icon"
                  size={15}
                  aria-hidden
                />
                <input
                  id="fp-email"
                  type="email"
                  className="form-control account-login-input account-login-input--has-start-icon"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            <button
              type="submit"
              className="account-signin-btn w-100"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
          <p className="account-auth-bottom-copy mb-0">
            Back to{" "}
            <Link
              to={ACCOUNT_LOGIN_PATH}
              replace
              className="account-auth-link account-auth-link-nowrap"
              state={{
                backgroundLocation:
                  location.state?.backgroundLocation ?? location,
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
