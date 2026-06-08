import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../../hooks/useAuth";
import { useAuthContext } from "../../contexts/AuthContext";
import { showToast } from "../../services/notificationService";
import { signInWithGoogleToken } from "../../services/firebaseAuth";
import {
  ACCOUNT_REGISTER_PATH,
  isAdminUser,
  navigateCloseAuthModal,
} from "../../utils/authRouting";
import Logo from "../../assets/logo.png";
import "./AccountAuthModal.css";

export default function AccountLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const { user, loading } = useAuthContext();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  /** Shown when this email is a Google-only account so password login is not the right path. */
  const [googleSignInHint, setGoogleSignInHint] = useState(null);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user && isAdminUser(user)) {
      navigate("/admin", { replace: true });
      return;
    }
    if (user && !isAdminUser(user)) {
      const to = location.state?.from?.pathname || "/account/orders";
      navigate(to, { replace: true });
    }
  }, [loading, user, navigate, location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      showToast.error("Enter email and password.");
      return;
    }
    setSubmitting(true);
    try {
      setGoogleSignInHint(null);
      const result = await login(form.email.trim(), form.password);
      if (result.useGoogleSignIn) {
        setGoogleSignInHint(
          result.error ||
            "This account uses Google sign-in. Use the Google button below.",
        );
        showToast.info(
          result.error ||
            "Use Sign in with Google for this email.",
        );
        return;
      }
      if (result.requiresEmailVerification) {
        showToast.info(
          result.error ||
            "Enter the 6-digit code we sent to your email to finish signing in.",
        );
        navigate("/account/verify-email", {
          replace: true,
          state: {
            email: result.email ?? form.email.trim(),
            backgroundLocation:
              location.state?.backgroundLocation ?? { pathname: "/" },
          },
        });
        return;
      }
      if (!result.success) {
        showToast.error(result.error || "Login failed.");
        return;
      }
      if (isAdminUser(result.user)) {
        showToast.info("Redirecting to staff dashboard…");
        navigate("/admin", { replace: true });
        return;
      }
      showToast.success(`Welcome, ${result.user?.name ?? "back"}!`);
      const to = location.state?.from?.pathname || "/account/orders";
      navigate(to, { replace: true });
    } catch {
      showToast.error("Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (googleSubmitting || submitting) return;
    setGoogleSubmitting(true);
    try {
      const { idToken } = await signInWithGoogleToken();
      const result = await loginWithGoogle(idToken);
      if (result.requiresEmailVerification) {
        showToast.info(
          result.error ||
            "Enter the 6-digit code we sent to your email.",
        );
        navigate("/account/verify-email", {
          replace: true,
          state: {
            email: result.email ?? "",
            backgroundLocation:
              location.state?.backgroundLocation ?? { pathname: "/" },
          },
        });
        return;
      }
      if (!result.success) {
        showToast.error(result.error || "Google sign-in failed.");
        return;
      }
      if (isAdminUser(result.user)) {
        showToast.info("Redirecting to staff dashboard…");
        navigate("/admin", { replace: true });
        return;
      }
      showToast.success(`Welcome, ${result.user?.name ?? "back"}!`);
      const to = location.state?.from?.pathname || "/account/orders";
      navigate(to, { replace: true });
    } catch (error) {
      if (error?.code === "auth/popup-closed-by-user") return;
      showToast.error("Google sign-in failed.");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  /** @param {React.ChangeEvent<HTMLInputElement>} e */
  function onChange(e) {
    const { name, value } = e.target;
    setGoogleSignInHint(null);
    setForm((f) => ({ ...f, [name]: value }));
  }

  function closeModal() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      navigateCloseAuthModal(navigate, location);
    }, 220);
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
          <h1 className="mb-1 account-auth-title">Welcome back</h1>
          <p className="account-auth-subtitle mb-3">
            Sign in to your account to continue
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="acc-email">
                Email
              </label>
              <div className="position-relative">
                <FaEnvelope
                  className="account-auth-field-icon"
                  size={15}
                  aria-hidden
                />
                <input
                  id="acc-email"
                  name="email"
                  type="email"
                  className="form-control account-login-input account-login-input--has-start-icon"
                  autoComplete="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  disabled={submitting}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="acc-password">
                Password
              </label>
              <div className="position-relative">
                <FaLock
                  className="account-auth-field-icon"
                  size={15}
                  aria-hidden
                />
                <input
                  id="acc-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control pe-5 account-login-input account-login-input--has-start-icon"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={onChange}
                  required
                  disabled={submitting}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="account-password-toggle position-absolute top-50 end-0 translate-middle-y me-3"
                  disabled={submitting}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div className="account-auth-forgot-row">
              <Link
                to="/account/forgot-password"
                replace
                className="account-auth-link account-auth-meta-link"
                state={{
                  backgroundLocation:
                    location.state?.backgroundLocation ?? location,
                }}
              >
                Forgot password?
              </Link>
            </div>
            {googleSignInHint ? (
              <div
                className="alert alert-info small py-2 px-3 mb-3"
                role="status"
              >
                {googleSignInHint}
              </div>
            ) : null}
            <button
              type="submit"
              className="account-signin-btn w-100"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="account-auth-bottom-copy mb-0">
            Don&apos;t have an account?{" "}
            <Link
              to={ACCOUNT_REGISTER_PATH}
              replace
              className="account-auth-link account-auth-link-nowrap"
              state={{
                backgroundLocation:
                  location.state?.backgroundLocation ?? location,
              }}
            >
              Sign up
            </Link>
          </p>
          <div className="account-auth-divider">
            <span>Or login with</span>
          </div>
          <button
            type="button"
            className="account-google-btn w-100"
            onClick={handleGoogleSignIn}
            disabled={googleSubmitting || submitting}
          >
            <FcGoogle size={18} className="account-google-icon" />
            <span>{googleSubmitting ? "Please wait..." : "Google"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
