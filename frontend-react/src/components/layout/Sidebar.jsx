import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  PlusCircle
} from 'lucide-react';
import { getMenuItems } from '../../utils/roles';

const ICONS = {
  '/dashboard': LayoutDashboard,
  '/peticiones': FileText,
  '/peticiones/nueva': PlusCircle,
  '/usuarios': Users
};

export function Sidebar({ rol, open, onNavigate }) {
  const items = getMenuItems(rol);

  return (
    <aside className={`app-sidebar ${open ? 'open' : ''}`.trim()}>
      <div className="sidebar-brand">
        <img src="/logo-muni.png" alt="" aria-hidden="true" />
        <div>
          <strong>Municipalidad de Jalapa</strong>
          <span>Gestión ciudadana</span>
        </div>
      </div>
      <div className="sidebar-label">Menú principal</div>
      <nav>
        <ul>
          {items.map((item) => {
            const Icon = ICONS[item.to] || FileText;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onNavigate}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
