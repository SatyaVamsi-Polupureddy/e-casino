import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 1. If no token, kick them to login
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  // 2. If token exists but role is wrong (e.g., Player trying to access Admin)
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />; // You'll need an Unauthorized page
  }

  // 3. If passed, render the child component (The Dashboard)
  return <Outlet />;
};

export default ProtectedRoute;
