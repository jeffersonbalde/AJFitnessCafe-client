import { useAuthContext } from "../contexts/AuthContext";
import { api, ensureCsrfCookie, setAuthToken } from "../lib/api";

export function useAuth() {
  const { user, setUser, loading, refreshMe, isAuthenticated } =
    useAuthContext();

  async function login(email, password) {
    try {
      await ensureCsrfCookie();
      const res = await api.post("/auth/login", { email, password });
      if (res.data?.token) setAuthToken(res.data.token);
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        await refreshMe();
      }
      return { success: true, user: res.data?.user ?? null };
    } catch (err) {
      const httpStatus = err?.response?.status;
      const data = err?.response?.data ?? {};
      const firstValidationError =
        data.errors && typeof data.errors === "object"
          ? Object.values(data.errors)
              .flat()
              .find((m) => typeof m === "string")
          : null;
      if (httpStatus === 403 && data.account_suspended) {
        return {
          success: false,
          accountSuspended: true,
          error:
            data.message ??
            "This account has been suspended. Contact support if you need help.",
          httpStatus,
        };
      }
      if (httpStatus === 403 && data.requires_email_verification) {
        return {
          success: false,
          requiresEmailVerification: true,
          email: data.email ?? String(email ?? "").trim(),
          error:
            data.message ??
            "Verify your email with the code we sent before signing in.",
          httpStatus,
        };
      }
      if (httpStatus === 422 && data.use_google_sign_in) {
        return {
          success: false,
          useGoogleSignIn: true,
          error:
            data.message ??
            "This account uses Google sign-in. Use the Google button below.",
          httpStatus,
        };
      }
      const retryAfterRaw = err?.response?.headers?.["retry-after"];
      const retryAfterSeconds = retryAfterRaw
        ? Number.parseInt(String(retryAfterRaw), 10)
        : null;
      const accountStatus =
        data.accountStatus ??
        data.account_status ??
        data.status ??
        data.user_status ??
        null;
      const throttleMessage =
        httpStatus === 429 && Number.isFinite(retryAfterSeconds)
          ? `Too many login attempts. Please try again in ${retryAfterSeconds} second(s).`
          : null;
      return {
        success: false,
        httpStatus,
        accountStatus,
        rejection_remarks: data.rejection_remarks ?? data.rejectionRemarks ?? null,
        deactivation_remarks:
          data.deactivation_remarks ?? data.deactivationRemarks ?? null,
        error:
          throttleMessage ??
          firstValidationError ??
          data.message ??
          data.error ??
          err.message ??
          "Login failed. Please try again.",
      };
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Still clear local session if the network fails.
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  }

  async function register(payload) {
    try {
      await ensureCsrfCookie();
      const res = await api.post("/auth/register", payload);
      if (res.data?.token) setAuthToken(res.data.token);
      if (res.data?.user) setUser(res.data.user);
      const email =
        res.data?.email ?? (payload?.email ? String(payload.email).trim() : "");
      return {
        success: true,
        email,
        requiresEmailVerification: Boolean(
          res.data?.requires_email_verification,
        ),
        user: res.data?.user ?? null,
      };
    } catch (err) {
      const data = err?.response?.data ?? {};
      const msg =
        data.message ||
        (data.errors
          ? Object.values(data.errors)
              .flat()
              .join(" ")
          : null) ||
        err.message ||
        "Registration failed.";
      return { success: false, error: msg, errors: data.errors };
    }
  }

  async function loginWithGoogle(idToken) {
    try {
      await ensureCsrfCookie();
      const res = await api.post("/auth/google", { id_token: idToken });
      if (!res.data?.token && res.data?.requires_email_verification) {
        return {
          success: false,
          requiresEmailVerification: true,
          email: res.data?.email ?? "",
          error:
            res.data?.message ??
            "Check your email for a verification code.",
          user: null,
        };
      }
      if (res.data?.token) setAuthToken(res.data.token);
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        await refreshMe();
      }
      return { success: true, user: res.data?.user ?? null };
    } catch (err) {
      const data = err?.response?.data ?? {};
      return {
        success: false,
        error: data.message ?? err?.message ?? "Google sign-in failed.",
      };
    }
  }

  async function resendVerificationEmail() {
    try {
      const res = await api.post("/auth/email/verification-notification");
      return { success: true, message: res.data?.message ?? "Verification email sent." };
    } catch (err) {
      const data = err?.response?.data ?? {};
      return {
        success: false,
        error: data.message ?? err?.message ?? "Could not send verification email.",
      };
    }
  }

  async function sendEmailOtp() {
    try {
      const res = await api.post("/auth/email/otp/send");
      return { success: true, message: res.data?.message ?? "Code sent." };
    } catch (err) {
      const data = err?.response?.data ?? {};
      return {
        success: false,
        error: data.message ?? err?.message ?? "Could not send verification code.",
      };
    }
  }

  async function verifyEmailOtp(code) {
    try {
      const res = await api.post("/auth/email/otp/verify", { code });
      if (res.data?.token) setAuthToken(res.data.token);
      if (res.data?.user) setUser(res.data.user);
      else await refreshMe();
      return { success: true, user: res.data?.user ?? null };
    } catch (err) {
      const data = err?.response?.data ?? {};
      const msg =
        (data.errors?.code && data.errors.code[0]) ||
        data.message ||
        err?.message ||
        "Verification failed.";
      return { success: false, error: msg };
    }
  }

  async function sendEmailOtpGuest(email) {
    try {
      const res = await api.post("/auth/email/otp/send-guest", {
        email: String(email ?? "").trim(),
      });
      return { success: true, message: res.data?.message ?? "Code sent." };
    } catch (err) {
      const data = err?.response?.data ?? {};
      return {
        success: false,
        error: data.message ?? err?.message ?? "Could not send verification code.",
      };
    }
  }

  async function verifyEmailOtpGuest(email, code) {
    try {
      const res = await api.post("/auth/email/otp/verify-guest", {
        email: String(email ?? "").trim(),
        code: String(code ?? "").replace(/\D/g, ""),
      });
      if (res.data?.token) setAuthToken(res.data.token);
      if (res.data?.user) setUser(res.data.user);
      else await refreshMe();
      return { success: true, user: res.data?.user ?? null };
    } catch (err) {
      const data = err?.response?.data ?? {};
      const msg =
        (data.errors?.code && data.errors.code[0]) ||
        data.message ||
        err?.message ||
        "Verification failed.";
      return { success: false, error: msg };
    }
  }

  async function getVerificationStatus() {
    try {
      const res = await api.get("/auth/email/verification-status");
      return { success: true, verified: Boolean(res.data?.verified) };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message ?? err?.message ?? "Could not check verification status." };
    }
  }

  async function requestPasswordReset(email) {
    try {
      const res = await api.post("/auth/password/forgot", {
        email: String(email ?? "").trim(),
      });
      return { success: true, message: res.data?.message ?? "Reset link sent." };
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data ?? {};
      const retryAfterRaw = err?.response?.headers?.["retry-after"];
      const retryAfterSeconds = retryAfterRaw
        ? Number.parseInt(String(retryAfterRaw), 10)
        : null;
      if (status === 403 && data.requires_email_verification) {
        return {
          success: false,
          requiresEmailVerification: true,
          email: data.email ?? String(email ?? "").trim(),
          error:
            data.message ?? "Please verify your email before resetting your password.",
        };
      }
      if (status === 422 && data.use_google_sign_in) {
        return {
          success: false,
          useGoogleSignIn: true,
          error:
            data.message ??
            "This account uses Google sign-in. Use Google sign-in instead.",
        };
      }
      if (status === 429 && Number.isFinite(retryAfterSeconds)) {
        return {
          success: false,
          error: `Too many reset requests. Please try again in ${retryAfterSeconds} second(s).`,
        };
      }
      return {
        success: false,
        error: data.message ?? err?.message ?? "Could not send reset link.",
      };
    }
  }

  async function resetPassword({ email, token, password, password_confirmation }) {
    try {
      const res = await api.post("/auth/password/reset", {
        email: String(email ?? "").trim(),
        token: String(token ?? ""),
        password,
        password_confirmation,
      });
      return { success: true, message: res.data?.message ?? "Password reset." };
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data ?? {};
      const firstValidationError =
        data.errors && typeof data.errors === "object"
          ? Object.values(data.errors)
              .flat()
              .find((m) => typeof m === "string")
          : null;
      if (status === 403 && data.requires_email_verification) {
        return {
          success: false,
          requiresEmailVerification: true,
          email: data.email ?? String(email ?? "").trim(),
          error:
            data.message ?? "Please verify your email before resetting your password.",
        };
      }
      if (status === 422 && data.use_google_sign_in) {
        return {
          success: false,
          useGoogleSignIn: true,
          error:
            data.message ??
            "This account uses Google sign-in. Use Google sign-in instead.",
        };
      }
      return {
        success: false,
        error:
          firstValidationError ??
          data.message ??
          err?.message ??
          "Could not reset password.",
      };
    }
  }

  return {
    user,
    setUser,
    loading,
    refreshMe,
    isAuthenticated,
    login,
    logout,
    register,
    loginWithGoogle,
    sendEmailOtp,
    sendEmailOtpGuest,
    verifyEmailOtp,
    verifyEmailOtpGuest,
    resendVerificationEmail,
    getVerificationStatus,
    requestPasswordReset,
    resetPassword,
  };
}
