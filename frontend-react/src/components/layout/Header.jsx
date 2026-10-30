import { LogOut, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { ROLE_LABELS } from '../../utils/roles';
import { getInitials } from '../../utils/formatters';

export function Header({ user, onLogout, onToggleSidebar }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button type="button" className="menu-toggle" onClick={onToggleSidebar} aria-label="Menú">
          <Menu size={18} />
        </button>
        <div className="header-brand">
          <h1>Sistema de Peticiones</h1>
          <p>Municipalidad de Jalapa</p>
        </div>
      </div>

      <div className="header-right">
        <div className="user-chip">
          <div className="user-avatar">{getInitials(user?.nombre)}</div>
          <div className="user-meta">
            <strong>{user?.nombre}</strong>
            <span>{ROLE_LABELS[user?.rol] || user?.rol}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="header-logout" onClick={onLogout} aria-label="Salir">
          <LogOut size={15} />
          <span className="header-logout-label">Salir</span>
        </Button>
      </div>
    </header>
  );
}
