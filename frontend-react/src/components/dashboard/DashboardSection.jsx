export function DashboardSection({ children, className = '' }) {
  return (
    <div className={`dashboard-section ${className}`.trim()}>
      {children}
    </div>
  );
}
