import { Outlet, Navigate, useLocation } from "react-router-dom";

const ProtectedRouter = ({ allowedRoles = [] }) => {
  const location = useLocation();

  // FIXED localStorage keys
  const authToken = localStorage.getItem("authToken");
  const userType = localStorage.getItem("userType");

  const isAuthenticated = !!authToken;
  const normalizedUserType = userType ? userType.toLowerCase() : null;

  // No token → go to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Role check
  if (allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());
    if (!normalizedAllowedRoles.includes(normalizedUserType)) {
      console.warn(
        `Access denied: User '${normalizedUserType}' cannot enter ${location.pathname}`
      );
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRouter;
