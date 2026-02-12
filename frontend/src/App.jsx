import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/public/LandingPage";
import AuthPage from "./pages/public/AuthPage";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import TenantStaffDashboard from "./pages/staff/TenantStaffDashboard";
import PlayerDashboard from "./pages/player/PlayerDashboard";
import GamePage from "./pages/player/GamePage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <>
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
              primary: "#22C55E",
              secondary: "#1a1a1a",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />

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

        {/* SUPER ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
        </Route>

        {/* TENANT ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={["TENANT_ADMIN"]} />}>
          <Route path="/tenant/dashboard" element={<TenantDashboard />} />
        </Route>

        {/* TENANT STAFF */}
        <Route element={<ProtectedRoute allowedRoles={["TENANT_STAFF"]} />}>
          <Route path="/staff/dashboard" element={<TenantStaffDashboard />} />
        </Route>

        {/* PLAYER */}
        <Route element={<ProtectedRoute allowedRoles={["PLAYER"]} />}>
          <Route path="/players/dashboard" element={<PlayerDashboard />} />
          <Route path="/play/:gameId" element={<GamePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
