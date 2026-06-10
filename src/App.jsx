import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { STORAGE_KEYS } from './config/constants';

// Auth pages
import RoleSelect from './pages/RoleSelect';
import OwnerRegister from './pages/OwnerRegister';
import OwnerLogin from './pages/OwnerLogin';
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
 * HomeRedirect — smart entry point:
 *  1. Already authenticated → go to their dashboard
 *  2. Owner account exists in localStorage → go to /login/owner
 *  3. No owner account ever registered → go to /register/owner
 *  4. Otherwise show RoleSelect (catches staff)
 */
function HomeRedirect() {
  const { isAuthenticated, role } = useAuth();

  // Already logged in
  if (isAuthenticated && role) {
    return <Navigate to={`/${role}`} replace />;
  }

  // Show the role selection screen to choose Owner or Staff
  return <Navigate to="/select-role" replace />;
}

/**
 * AppRoutes — all routes
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Entry point */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Auth */}
      <Route path="/register/owner" element={<OwnerRegister />} />
      <Route path="/login/owner" element={<OwnerLogin />} />
      <Route path="/login/staff" element={<StaffLogin />} />
      {/* RoleSelect still accessible for staff to navigate to their login */}
      <Route path="/select-role" element={<RoleSelect />} />

      {/* Owner routes (protected) */}
      <Route path="/owner" element={<ProtectedRoute requiredRole="owner"><Dashboard /></ProtectedRoute>} />
      <Route path="/owner/voice-order" element={<ProtectedRoute requiredRole="owner"><VoiceOrder /></ProtectedRoute>} />
      <Route path="/owner/confirm-order" element={<ProtectedRoute requiredRole="owner"><ConfirmOrder /></ProtectedRoute>} />
      <Route path="/owner/manual-order" element={<ProtectedRoute requiredRole="owner"><ManualOrder /></ProtectedRoute>} />
      <Route path="/owner/orders/:id" element={<ProtectedRoute requiredRole="owner"><OrderDetail /></ProtectedRoute>} />
      <Route path="/owner/customers" element={<ProtectedRoute requiredRole="owner"><CustomerList /></ProtectedRoute>} />
      <Route path="/owner/export" element={<ProtectedRoute requiredRole="owner"><MonthlyExport /></ProtectedRoute>} />
      <Route path="/owner/profile" element={<ProtectedRoute requiredRole="owner"><Profile /></ProtectedRoute>} />

      {/* Staff routes (protected) */}
      <Route path="/staff" element={<ProtectedRoute requiredRole="staff"><OrderQueue /></ProtectedRoute>} />
      <Route path="/staff/dispatched" element={<ProtectedRoute requiredRole="staff"><DispatchedToday /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { useNotifications } from './hooks/useNotifications';

/**
 * GlobalHooks — mount global effects like polling for notifications
 */
function GlobalHooks() {
  useNotifications();
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <GlobalHooks />
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
