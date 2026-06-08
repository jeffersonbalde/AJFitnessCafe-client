import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { ADMIN_LOGIN_PATH, isAdminUser } from "../utils/authRouting";

/**
 * Requires a valid Sanctum token and an admin user (`is_admin` from API).
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: "var(--background-light, #f5f7fb)" }}
      >
        <div className="text-muted small">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to={ADMIN_LOGIN_PATH} replace state={{ from: location }} />
    );
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
