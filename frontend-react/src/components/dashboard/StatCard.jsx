export function StatCard({ label, value, icon: Icon, tone = 'tone-navy' }) {
  const toneClass = tone === 'accent' || tone === 'tone-gold' ? 'tone-navy' : tone;
  return (
    <article className={`stat-card ${toneClass}`.trim()}>
      <div className="stat-top">
        <div>
          <div className="value">{value}</div>
          <div className="label">{label}</div>
        </div>
        {Icon && (
          <div className="stat-icon" aria-hidden="true">
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>
    </article>
  );
}
