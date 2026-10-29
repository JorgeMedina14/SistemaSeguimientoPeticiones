import { Star } from 'lucide-react';

export function SectionDivider({ tone = 'navy', children }) {
  return (
    <div className={`login-divider login-divider-${tone}`} aria-hidden="true">
      <span className="login-divider-mark">
        {children ?? <Star size={11} fill="currentColor" strokeWidth={0} />}
      </span>
    </div>
  );
}
