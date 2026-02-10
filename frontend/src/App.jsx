import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// --- PAGES ---
import { Toaster } from "react-hot-toast";
import AuthPage from "./pages/public/AuthPage";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import TenantStaffDashboard from "./pages/staff/TenantStaffDashboard"; // Import Staff Page
import PlayerDashboard from "./pages/player/PlayerDashboard"; // Assuming this exists
import GamePage from "./pages/player/GamePage";
// --- COMPONENTS ---
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #333",
          },
          success: {
            iconTheme: {
              primary: "#22C55E", // Green
              secondary: "#1a1a1a",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444", // Red
              secondary: "#fff",
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <AuthPage
              targetRole="PLAYER"
              title="Player Login"
              initialLoginState={true}
            />
          }
        />

        <Route
          path="/register"
          element={
            <AuthPage
              targetRole="PLAYER"
              title="Create Account"
              initialLoginState={false}
            />
          }
        />
        <Route
          path="/tenant"
          element={<Navigate to="/tenant/login" replace />}
        />

        <Route
          path="/tenant/login"
          element={
            <AuthPage
              targetRole="TENANT_ADMIN"
              disableSignup={true}
              title="Management Portal"
              initialLoginState={true}
            />
          }
        />
        <Route
          path="/super-admin"
          element={<Navigate to="/super-admin/login" replace />}
        />

        <Route
          path="/super-admin/login"
          element={
            <AuthPage
              targetRole="SUPER_ADMIN"
              disableSignup={true}
              title="Super Admin Access"
              initialLoginState={true}
            />
          }
        />

        {/* --- PROTECTED ROUTES --- */}

        {/* 1. SUPER ADMIN (Only SUPER_ADMIN can access) */}
        <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
        </Route>

        {/* 2. TENANT ADMIN (Only TENANT_ADMIN can access) */}
        <Route element={<ProtectedRoute allowedRoles={["TENANT_ADMIN"]} />}>
          {/* Note: I corrected the path to /tenant/dashboard to match your Login logic */}
          <Route path="/tenant/dashboard" element={<TenantDashboard />} />
        </Route>

        {/* 3. STAFF (Only TENANT_STAFF can access) */}
        <Route element={<ProtectedRoute allowedRoles={["TENANT_STAFF"]} />}>
          <Route path="/staff/dashboard" element={<TenantStaffDashboard />} />
        </Route>

        {/* 4. PLAYER (Only PLAYER can access) */}
        <Route element={<ProtectedRoute allowedRoles={["PLAYER"]} />}>
          <Route path="/players/dashboard" element={<PlayerDashboard />} />
          <Route path="/play/:gameId" element={<GamePage />} />
        </Route>

        {/* Catch-all: Redirect unknown routes to Auth */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
