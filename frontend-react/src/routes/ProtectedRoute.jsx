import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ui/Feedback';
import { getHomePath } from '../utils/roles';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader text="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!roles.includes(user?.rol)) {
    return <Navigate to={getHomePath(user?.rol)} replace />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <Loader />;
  if (isAuthenticated) {
    return <Navigate to={getHomePath(user?.rol)} replace />;
  }
  return <Outlet />;
}
