import { Handshake, ShieldCheck, UserRound } from 'lucide-react';
import { MunicipalLogo } from './MunicipalLogo';
import { SectionDivider } from './SectionDivider';

const VALUES = [
  { icon: UserRound, title: 'Atención', detail: 'Ciudadana' },
  { icon: ShieldCheck, title: 'Transparencia', detail: 'y Confianza' },
  { icon: Handshake, title: 'Compromiso', detail: 'con Jalapa' }
];

export function InstitutionalPanel() {
  return (
    <aside className="login-institutional">
      <div className="login-institutional-backdrop" aria-hidden="true" />

      <div className="login-statement">
        <MunicipalLogo size="lg" decorative />
        <SectionDivider tone="gold" />

        <p className="login-slogan">
          <span className="login-slogan-lead">Donde no hay</span>
          <span className="login-slogan-accent">Corrupción</span>
          <span className="login-slogan-main">Hay</span>
          <span className="login-slogan-main">Obras</span>
        </p>

        <span className="login-underline" aria-hidden="true" />

        <p className="login-statement-text">
          Un gobierno municipal abierto y eficiente
          <br />
          al servicio de <strong>nuestra gente.</strong>
        </p>
      </div>

      <ul className="login-values">
        {VALUES.map(({ icon: Icon, title, detail }) => (
          <li key={title}>
            <span className="login-value-icon">
              <Icon size={22} strokeWidth={1.6} />
            </span>
            <p>
              {title}
              <br />
              {detail}
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
