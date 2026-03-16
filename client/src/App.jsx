import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectAuthLoading, verifyAuth } from './store/authSlice';
import SplashScreen from './components/SplashScreen';

const Home           = lazy(() => import('./pages/Home'));
const Login          = lazy(() => import('./pages/Login'));
const Browse         = lazy(() => import('./pages/Browse'));
const Watch          = lazy(() => import('./pages/Watch'));
const Profile        = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ScriptAI       = lazy(() => import('./pages/ScriptAI'));
const Upload         = lazy(() => import('./pages/Upload'));
const Upcoming       = lazy(() => import('./pages/Upcoming'));
const Creators       = lazy(() => import('./pages/Creators'));
const NotFound       = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c' }}>
      <div className="spinner" />
    </div>
  );
}

function PrivateRoute({ children }) {
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  if (loading) return <PageLoader />;
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(verifyAuth());
  }, [dispatch]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/browse"    element={<Browse />} />
          <Route path="/upcoming"  element={<Upcoming />} />
          <Route path="/creators"  element={<Creators />} />
          <Route path="/watch/:id" element={<PrivateRoute><Watch /></PrivateRoute>} />
          <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/ai"        element={<PrivateRoute><ScriptAI /></PrivateRoute>} />
          <Route path="/upload"    element={<PrivateRoute><Upload /></PrivateRoute>} />
          <Route path="/admin"     element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      {!showSplash && <AppRoutes />}
    </>
  );
}
