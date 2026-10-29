export const ROLES = {
  ADMIN: 'ADMIN',
  ALCALDE: 'ALCALDE',
  JEFE_DEPTO: 'JEFE_DEPTO',
  RECEPCION: 'RECEPCION'
};

export const ROLE_LABELS = {
  ADMIN: 'Administrador',
  ALCALDE: 'Alcalde',
  JEFE_DEPTO: 'Jefe de Departamento',
  RECEPCION: 'Recepción'
};

export function canAccessDashboard(rol) {
  return rol === ROLES.ADMIN || rol === ROLES.ALCALDE;
}

export function canManageUsers(rol) {
  return rol === ROLES.ADMIN;
}

export function canCreatePeticion(rol) {
  return rol === ROLES.RECEPCION || rol === ROLES.ALCALDE;
}

export function canChangeEstado(rol) {
  return rol === ROLES.ADMIN || rol === ROLES.ALCALDE || rol === ROLES.JEFE_DEPTO;
}

export function canDeletePeticion(rol) {
  return rol === ROLES.ADMIN || rol === ROLES.ALCALDE;
}

export function getHomePath(rol) {
  return canAccessDashboard(rol) ? '/dashboard' : '/peticiones';
}

export function getMenuItems(rol) {
  const items = [
    { to: '/dashboard', label: 'Dashboard', roles: [ROLES.ADMIN, ROLES.ALCALDE] },
    { to: '/peticiones', label: 'Peticiones', roles: [ROLES.ADMIN, ROLES.ALCALDE, ROLES.JEFE_DEPTO, ROLES.RECEPCION] },
    { to: '/peticiones/nueva', label: 'Nueva petición', roles: [ROLES.RECEPCION, ROLES.ALCALDE] },
    { to: '/usuarios', label: 'Usuarios', roles: [ROLES.ADMIN] }
  ];
  return items.filter((item) => item.roles.includes(rol));
}
