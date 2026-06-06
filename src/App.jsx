import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Auth pages
import RoleSelect from './pages/RoleSelect';
import PinSetup from './pages/PinSetup';
import PinLogin from './pages/PinLogin';
import StaffLogin from './pages/StaffLogin';

// Owner pages
import Dashboard from './pages/owner/Dashboard';
import VoiceOrder from './pages/owner/VoiceOrder';
import ConfirmOrder from './pages/owner/ConfirmOrder';
import ManualOrder from './pages/owner/ManualOrder';
import OrderDetail from './pages/owner/OrderDetail';
import CustomerList from './pages/owner/CustomerList';
import MonthlyExport from './pages/owner/MonthlyExport';
import Profile from './pages/owner/Profile';

// Staff pages
import OrderQueue from './pages/staff/OrderQueue';
import DispatchedToday from './pages/staff/DispatchedToday';

/**
 * ProtectedRoute — guards routes by role
 * Redirects to '/' if not authenticated for the required role
 */
function ProtectedRoute({ requiredRole, children }) {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * HomeRedirect — handles '/' route logic
 * MVP: always shows RoleSelect (PIN 0000 works without any setup step).
 */
function HomeRedirect() {
  const { isAuthenticated, role } = useAuth();

  // If already authenticated, redirect to their dashboard
  if (isAuthenticated && role) {
    return <Navigate to={`/${role}`} replace />;
  }

  // MVP: skip PinSetup, go straight to role selection
  return <RoleSelect />;
}

/**
 * AppRoutes — all routes wrapped in auth context
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Home / Auth */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login/owner" element={<PinLogin />} />
      <Route path="/login/staff" element={<StaffLogin />} />

      {/* Owner routes (protected) */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute requiredRole="owner">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/voice-order"
        element={
          <ProtectedRoute requiredRole="owner">
            <VoiceOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/confirm-order"
        element={
          <ProtectedRoute requiredRole="owner">
            <ConfirmOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/manual-order"
        element={
          <ProtectedRoute requiredRole="owner">
            <ManualOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/orders/:id"
        element={
          <ProtectedRoute requiredRole="owner">
            <OrderDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/customers"
        element={
          <ProtectedRoute requiredRole="owner">
            <CustomerList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/export"
        element={
          <ProtectedRoute requiredRole="owner">
            <MonthlyExport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/profile"
        element={
          <ProtectedRoute requiredRole="owner">
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Staff routes (protected) */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute requiredRole="staff">
            <OrderQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/dispatched"
        element={
          <ProtectedRoute requiredRole="staff">
            <DispatchedToday />
          </ProtectedRoute>
        }
      />

      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * App — root component
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
