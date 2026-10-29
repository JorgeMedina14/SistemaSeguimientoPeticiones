import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { getHomePath, ROLES } from '../utils/roles';
import { Loader } from '../components/ui/Feedback';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Peticiones from '../pages/Peticiones';
import PeticionDetalle from '../pages/PeticionDetalle';
import NuevaPeticion from '../pages/NuevaPeticion';
import Usuarios from '../pages/Usuarios';
import NotFound from '../pages/NotFound';

function HomeRedirect() {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getHomePath(user?.rol)} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/" element={<HomeRedirect />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route element={<RoleRoute roles={[ROLES.ADMIN, ROLES.ALCALDE]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reportes" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="/peticiones" element={<Peticiones />} />

          <Route element={<RoleRoute roles={[ROLES.RECEPCION, ROLES.ALCALDE]} />}>
            <Route path="/peticiones/nueva" element={<NuevaPeticion />} />
          </Route>

          <Route path="/peticiones/:id" element={<PeticionDetalle />} />

          <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
