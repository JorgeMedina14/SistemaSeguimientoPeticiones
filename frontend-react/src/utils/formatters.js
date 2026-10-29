const ESTADO_BADGE = {
  RECIBIDA: 'info',
  EN_REVISION: 'info',
  ASIGNADA: 'process',
  EN_PROCESO: 'process',
  RESUELTA: 'success',
  RECHAZADA: 'danger',
  CERRADA: 'neutral'
};

const ESTADO_LABEL = {
  RECIBIDA: 'Recibida',
  EN_REVISION: 'En revisión',
  ASIGNADA: 'Asignada',
  EN_PROCESO: 'En proceso',
  RESUELTA: 'Resuelta',
  RECHAZADA: 'Rechazada',
  CERRADA: 'Cerrada'
};

const PRIORIDAD_BADGE = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'warning'
};

const PRIORIDAD_LABEL = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente'
};

export const ESTADOS = Object.keys(ESTADO_LABEL);
export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'];

export function getEstadoBadge(estado) {
  return ESTADO_BADGE[estado] || 'default';
}

export function formatEstado(estado) {
  return ESTADO_LABEL[estado] || estado || '—';
}

export function getPrioridadBadge(prioridad) {
  return PRIORIDAD_BADGE[prioridad] || 'default';
}

export function formatPrioridad(prioridad) {
  return PRIORIDAD_LABEL[prioridad] || prioridad || '—';
}

export function formatPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.0%';
  return `${n.toFixed(1)}%`;
}

const APP_TIMEZONE = 'America/Guatemala';

function toAppDate(value) {
  if (!value && value !== 0) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = toAppDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('es-GT', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(value) {
  const date = toAppDate(value);
  if (!date) return '—';
  return date.toLocaleString('es-GT', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

export function getApiError(error, fallback = 'Ocurrió un error') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.mensaje ||
    error?.message ||
    fallback
  );
}

export function previousPeriod(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 29);
    const anteriorFin = new Date(inicio);
    anteriorFin.setDate(anteriorFin.getDate() - 1);
    const anteriorInicio = new Date(anteriorFin);
    anteriorInicio.setDate(anteriorInicio.getDate() - 29);
    return {
      fechaInicio: anteriorInicio.toISOString().slice(0, 10),
      fechaFin: anteriorFin.toISOString().slice(0, 10)
    };
  }
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const delta = fin.getTime() - inicio.getTime();
  const anteriorFin = new Date(inicio.getTime() - 1);
  const anteriorInicio = new Date(anteriorFin.getTime() - delta);
  return {
    fechaInicio: anteriorInicio.toISOString().slice(0, 10),
    fechaFin: anteriorFin.toISOString().slice(0, 10)
  };
}
