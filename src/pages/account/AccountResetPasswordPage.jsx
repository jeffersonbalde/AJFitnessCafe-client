import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaTimesCircle,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../services/notificationService";
import {
  ACCOUNT_LOGIN_PATH,
  navigateCloseAuthModal,
} from "../../utils/authRouting";
import Logo from "../../assets/logo.png";
import "./AccountAuthModal.css";

export default function AccountResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [form, setForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    password_confirmation: false,
  });
  const [errors, setErrors] = useState({});

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get("token") ?? "";
  const email = (params.get("email") ?? "").trim();

  function getPasswordRules(password) {
    return [
      {
        key: "length",
        label: "At least 8 characters",
        valid: password.length >= 8,
      },
      {
        key: "letter",
        label: "Contains a letter",
        valid: /[A-Za-z]/.test(password),
      },
      {
        key: "number",
        label: "Contains a number",
        valid: /\d/.test(password),
      },
    ];
  }

  function validateField(name, value, draftForm = form) {
    if (name === "password") {
      if (!value) return "Password is required.";
      if (value.length < 8) return "Password must be at least 8 characters.";
      if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
        return "Password does not meet the requirements.";
      }
      return "";
    }
    if (name === "password_confirmation") {
      if (!value) return "Confirm your password.";
      if (value !== draftForm.password) return "Passwords do not match.";
      return "";
    }
    return "";
  }

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
    if (!email || !token) {
      showToast.error("Invalid reset link. Please request a new one.");
      return;
    }
    const nextTouched = { password: true, password_confirmation: true };
    setTouched(nextTouched);
    const nextErrors = {};
    const pwError = validateField("password", form.password, form);
    const pcError = validateField(
      "password_confirmation",
      form.password_confirmation,
      form,
    );
    if (pwError) nextErrors.password = pwError;
    if (pcError) nextErrors.password_confirmation = pcError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast.error(nextErrors[Object.keys(nextErrors)[0]]);
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetPassword({
        email,
        token,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      if (result.useGoogleSignIn) {
        showToast.info(
          result.error ??
            "This account uses Google sign-in. Use the Google button instead.",
        );
        return;
      }
      if (result.requiresEmailVerification) {
        showToast.info(
          result.error ?? "Please verify your email before resetting your password.",
        );
        return;
      }
      if (!result.success) {
        showToast.error(result.error || "Could not reset password.");
        return;
      }
      showToast.success(result.message ?? "Password reset. You can now sign in.");
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
          <h1 className="mb-1 account-auth-title">Set a new password</h1>
          <p className="account-auth-subtitle mb-3">
            Reset password for <strong className="text-body">{email || "your account"}</strong>.
          </p>

          <form onSubmit={onSubmit}>
            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="rp-password">
                New password
              </label>
              <div className="position-relative">
                <FaLock className="account-auth-field-icon" size={15} aria-hidden />
                <input
                  id="rp-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-control pe-5 account-login-input account-login-input--has-start-icon${touched.password && errors.password ? " account-input-invalid" : ""}`}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => {
                      const updated = { ...f, password: e.target.value };
                      const pwError = validateField("password", updated.password, updated);
                      const pcError = validateField(
                        "password_confirmation",
                        updated.password_confirmation,
                        updated,
                      );
                      setErrors((prev) => ({
                        ...prev,
                        password: pwError || undefined,
                        password_confirmation: pcError || undefined,
                      }));
                      return updated;
                    })
                  }
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => {
                    setPasswordFocused(false);
                    setTouched((t) => ({ ...t, password: true }));
                    setErrors((prev) => {
                      const msg = validateField("password", form.password, form);
                      const next = { ...prev };
                      if (msg) next.password = msg;
                      else delete next.password;
                      return next;
                    });
                  }}
                  required
                  minLength={8}
                  disabled={submitting}
                  placeholder="At least 8 characters"
                  aria-invalid={Boolean(touched.password && errors.password)}
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
              <AnimatePresence initial={false}>
                {(passwordFocused || Boolean(form.password)) && (
                  <motion.div
                    className="account-password-rules"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {getPasswordRules(form.password).map((rule) => (
                      <p
                        key={rule.key}
                        className={`account-password-rule${rule.valid ? " is-valid" : ""}`}
                      >
                        {rule.valid ? <FaCheckCircle /> : <FaTimesCircle />}
                        <span>{rule.label}</span>
                      </p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {touched.password && errors.password ? (
                  <motion.p
                    className="account-auth-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {errors.password}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="rp-password-confirm">
                Confirm new password
              </label>
              <div className="position-relative">
                <FaLock className="account-auth-field-icon" size={15} aria-hidden />
                <input
                  id="rp-password-confirm"
                  name="password_confirmation"
                  type={showPasswordConfirm ? "text" : "password"}
                  className={`form-control pe-5 account-login-input account-login-input--has-start-icon${touched.password_confirmation && errors.password_confirmation ? " account-input-invalid" : ""}`}
                  autoComplete="new-password"
                  value={form.password_confirmation}
                  onChange={(e) =>
                    setForm((f) => {
                      const updated = {
                        ...f,
                        password_confirmation: e.target.value,
                      };
                      const pcError = validateField(
                        "password_confirmation",
                        updated.password_confirmation,
                        updated,
                      );
                      setErrors((prev) => ({
                        ...prev,
                        password_confirmation: pcError || undefined,
                      }));
                      return updated;
                    })
                  }
                  onBlur={() => {
                    setTouched((t) => ({ ...t, password_confirmation: true }));
                    setErrors((prev) => {
                      const msg = validateField(
                        "password_confirmation",
                        form.password_confirmation,
                        form,
                      );
                      const next = { ...prev };
                      if (msg) next.password_confirmation = msg;
                      else delete next.password_confirmation;
                      return next;
                    });
                  }}
                  required
                  minLength={8}
                  disabled={submitting}
                  placeholder="Repeat password"
                  aria-invalid={Boolean(
                    touched.password_confirmation && errors.password_confirmation,
                  )}
                />
                <button
                  type="button"
                  className="account-password-toggle position-absolute top-50 end-0 translate-middle-y me-3"
                  disabled={submitting}
                  onClick={() => setShowPasswordConfirm((v) => !v)}
                  aria-label={
                    showPasswordConfirm
                      ? "Hide password confirmation"
                      : "Show password confirmation"
                  }
                >
                  {showPasswordConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <AnimatePresence initial={false}>
                {touched.password_confirmation && errors.password_confirmation ? (
                  <motion.p
                    className="account-auth-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {errors.password_confirmation}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              className="account-signin-btn w-100"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Reset password"}
            </button>
          </form>

          <p className="account-auth-bottom-copy mb-0 mt-2">
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

