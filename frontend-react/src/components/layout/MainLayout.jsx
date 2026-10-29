import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('¿Desea cerrar sesión?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="app-shell">
      <Header
        user={user}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <Sidebar
        rol={user?.rol}
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />
      <main className="app-main">
        <div className="app-main-inner page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
