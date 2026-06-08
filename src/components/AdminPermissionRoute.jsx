import { Navigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { hasPermission } from "../utils/authRouting";

export default function AdminPermissionRoute({ permission, children }) {
  const { user } = useAuthContext();
  if (!hasPermission(user, permission)) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

