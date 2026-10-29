export function Loader({ text = 'Cargando...' }) {
  return (
    <div className="loader-wrap">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}

export function EmptyState({ title = 'Sin datos', description }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}
