// Main App Component with Routing

import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth-store';
import { socketService } from './services/socket';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';

// Lazy load route components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const LiveMap = lazy(() => import('./pages/LiveMap').then(m => ({ default: m.LiveMap })));
const Orders = lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
const Drones = lazy(() => import('./pages/Drones').then(m => ({ default: m.Drones })));
const Kiosks = lazy(() => import('./pages/Kiosks').then(m => ({ default: m.Kiosks })));
const Restaurants = lazy(() => import('./pages/Restaurants').then(m => ({ default: m.Restaurants })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="live-map"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
                <LiveMap />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
                <Orders />
              </Suspense>
            }
          />
          <Route
            path="drones"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
                <Drones />
              </Suspense>
            }
          />
          <Route
            path="kiosks"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
                <Kiosks />
              </Suspense>
            }
          />
          <Route
            path="restaurants"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
                <Restaurants />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
                <Analytics />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
