import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import {
  backgroundLocationForLoginModal,
  isAdminUser,
} from "../utils/authRouting";

/**
 * Requires login as a storefront customer (non-admin). Admins are sent to the panel.
 */
export default function CustomerProtectedRoute({ children }) {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="text-center py-5 text-muted small">Loading…</div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/account/login"
        replace
        state={{
          from: location,
          backgroundLocation: backgroundLocationForLoginModal(location),
        }}
      />
    );
  }

  if (isAdminUser(user)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
