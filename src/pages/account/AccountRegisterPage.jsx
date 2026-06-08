import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaPhone,
  FaTimesCircle,
  FaUser,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useAuthContext } from "../../contexts/AuthContext";
import { showToast } from "../../services/notificationService";
import { signInWithGoogleToken } from "../../services/firebaseAuth";
import {
  ACCOUNT_LOGIN_PATH,
  isAdminUser,
  navigateCloseAuthModal,
} from "../../utils/authRouting";
import Logo from "../../assets/logo.png";
import "./AccountAuthModal.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE_REGEX = /^09\d{9}$/;

function sanitizePhone(value) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export default function AccountRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle } = useAuth();
  const { user, loading } = useAuthContext();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

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
    const trimmed = typeof value === "string" ? value.trim() : value;
    if (name === "name") {
      if (!trimmed) return "Name is required.";
      return "";
    }

    if (name === "email") {
      if (!trimmed) return "Email is required.";
      if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address.";
      return "";
    }

    if (name === "phone") {
      if (!trimmed) return "Phone number is required.";
      if (!PH_MOBILE_REGEX.test(trimmed)) {
        return "Use PH format: 09XXXXXXXXX.";
      }
      return "";
    }

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

  function validateForm(values) {
    const nextErrors = {};
    for (const key of Object.keys(values)) {
      const message = validateField(key, values[key], values);
      if (message) nextErrors[key] = message;
    }
    return nextErrors;
  }

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
    if (user && !isAdminUser(user) && user.email_verified) {
      navigate("/account/orders", { replace: true });
    }
  }, [loading, user, navigate, location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validateForm(form);
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      password_confirmation: true,
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      showToast.error(nextErrors[Object.keys(nextErrors)[0]]);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      };
      const result = await register(payload);
      if (!result.success) {
        showToast.error(result.error || "Could not create account.");
        return;
      }
      showToast.success(
        "Check your email for a 6-digit code to verify your account.",
      );
      navigate("/account/verify-email", {
        replace: true,
        state: {
          email: result.email ?? payload.email.trim(),
          backgroundLocation:
            location.state?.backgroundLocation ?? { pathname: "/" },
        },
      });
    } catch {
      showToast.error("Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  /** @param {React.ChangeEvent<HTMLInputElement>} e */
  function onChange(e) {
    const { name, value } = e.target;
    const normalizedValue = name === "phone" ? sanitizePhone(value) : value;
    setForm((f) => {
      const updated = { ...f, [name]: normalizedValue };
      const fieldError = validateField(name, updated[name], updated);
      setErrors((prev) => {
        const copy = { ...prev };
        if (fieldError) copy[name] = fieldError;
        else delete copy[name];

        if (name === "password" || name === "password_confirmation") {
          const confirmError = validateField(
            "password_confirmation",
            updated.password_confirmation,
            updated,
          );
          if (confirmError) copy.password_confirmation = confirmError;
          else delete copy.password_confirmation;
        }
        return copy;
      });
      return updated;
    });
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  /** @param {React.FocusEvent<HTMLInputElement>} e */
  function onBlur(e) {
    const { name } = e.target;
    if (name === "password") {
      setPasswordFocused(false);
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => {
      const message = validateField(name, form[name], form);
      const copy = { ...prev };
      if (message) copy[name] = message;
      else delete copy[name];
      return copy;
    });
  }

  function closeModal() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      navigateCloseAuthModal(navigate, location);
    }, 220);
  }

  async function handleGoogleSignUp() {
    if (googleSubmitting || submitting) return;
    setGoogleSubmitting(true);
    try {
      const { idToken } = await signInWithGoogleToken();
      const result = await loginWithGoogle(idToken);
      if (result.requiresEmailVerification) {
        showToast.info(
          result.error ||
            "Check your email for a 6-digit code to verify your account.",
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
        showToast.error(result.error || "Google sign-up failed.");
        return;
      }
      if (isAdminUser(result.user)) {
        showToast.info("Redirecting to staff dashboard…");
        navigate("/admin", { replace: true });
        return;
      }
      showToast.success(`Welcome, ${result.user?.name ?? "back"}!`);
      navigate("/account/orders", { replace: true });
    } catch (error) {
      if (error?.code === "auth/popup-closed-by-user") return;
      showToast.error("Google sign-up failed.");
    } finally {
      setGoogleSubmitting(false);
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
          <h1 className="mb-1 account-auth-title">Create account</h1>
          <p className="account-auth-subtitle mb-3">
            Save your details and view order history.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="reg-name">
                Name *
              </label>
              <div className="position-relative">
                <FaUser className="account-auth-field-icon" size={15} aria-hidden />
                <input
                  id="reg-name"
                  name="name"
                  className={`form-control account-login-input account-login-input--has-start-icon${errors.name ? " account-input-invalid" : ""}`}
                  autoComplete="name"
                  value={form.name}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  disabled={submitting}
                  placeholder="Full name"
                  aria-invalid={Boolean(errors.name)}
                />
              </div>
              <AnimatePresence initial={false}>
                {touched.name && errors.name ? (
                  <motion.p
                    className="account-auth-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {errors.name}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="reg-email">
                Email *
              </label>
              <div className="position-relative">
                <FaEnvelope className="account-auth-field-icon" size={15} aria-hidden />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className={`form-control account-login-input account-login-input--has-start-icon${errors.email ? " account-input-invalid" : ""}`}
                  autoComplete="email"
                  value={form.email}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  disabled={submitting}
                  placeholder="Email address"
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
              <AnimatePresence initial={false}>
                {touched.email && errors.email ? (
                  <motion.p
                    className="account-auth-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {errors.email}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="reg-phone">
                Phone *
              </label>
              <div className="position-relative">
                <FaPhone className="account-auth-field-icon" size={15} aria-hidden />
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  className={`form-control account-login-input account-login-input--has-start-icon${errors.phone ? " account-input-invalid" : ""}`}
                  autoComplete="tel"
                  value={form.phone}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  disabled={submitting}
                  placeholder="09XXXXXXXXX"
                  inputMode="tel"
                  aria-invalid={Boolean(errors.phone)}
                />
              </div>
              <AnimatePresence initial={false}>
                {touched.phone && errors.phone ? (
                  <motion.p
                    className="account-auth-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {errors.phone}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
            <div className="mb-3 account-form-group">
              <label className="form-label account-auth-label" htmlFor="reg-password">
                Password * (min. 8 characters)
              </label>
              <div className="position-relative">
                <FaLock className="account-auth-field-icon" size={15} aria-hidden />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-control pe-5 account-login-input account-login-input--has-start-icon${errors.password ? " account-input-invalid" : ""}`}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={onChange}
                  onBlur={onBlur}
                  onFocus={() => setPasswordFocused(true)}
                  required
                  minLength={8}
                  disabled={submitting}
                  placeholder="Create password"
                  aria-invalid={Boolean(errors.password)}
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
            </div>
            <div className="mb-3 account-form-group">
              <label
                className="form-label account-auth-label"
                htmlFor="reg-password-confirm"
              >
                Confirm password *
              </label>
              <div className="position-relative">
                <FaLock className="account-auth-field-icon" size={15} aria-hidden />
                <input
                  id="reg-password-confirm"
                  name="password_confirmation"
                  type={showPasswordConfirm ? "text" : "password"}
                  className={`form-control pe-5 account-login-input account-login-input--has-start-icon${errors.password_confirmation ? " account-input-invalid" : ""}`}
                  autoComplete="new-password"
                  value={form.password_confirmation}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  minLength={8}
                  disabled={submitting}
                  placeholder="Confirm password"
                  aria-invalid={Boolean(errors.password_confirmation)}
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
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="account-auth-bottom-copy mb-0">
            Already have an account?{" "}
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
          <div className="account-auth-divider">
            <span>Or sign up with</span>
          </div>
          <button
            type="button"
            className="account-google-btn w-100"
            onClick={handleGoogleSignUp}
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
