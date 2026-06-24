import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import VerifyEmail from './pages/VerifyEmail';
import AcceptInvite from './pages/AcceptInvite';
import Onboarding from './pages/Onboarding';
import InternDashboard from './pages/InternDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import ReviewReport from './pages/ReviewReport';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Redirect authenticated users to their dashboard
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const path = user?.role === 'intern' ? '/dashboard' : '/admin';
    return <Navigate to={path} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Auth Flows */}
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />

          {/* Onboarding (Owner only, standalone full-screen flow) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Authenticated app shell (sidebar + topbar) */}
          <Route element={<AppLayout />}>
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['intern', 'admin', 'owner']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Intern Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['intern']}>
                  <InternDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-reports"
              element={
                <ProtectedRoute allowedRoles={['intern']}>
                  <InternDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin/Owner Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/team"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/review/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <ReviewReport />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#131316',
            color: '#f4f4f5',
            border: '1px solid #232329',
            fontSize: '0.9375rem',
          },
          success: {
            iconTheme: {
              primary: '#34d399',
              secondary: '#0a0a0c',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: '#0a0a0c',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
