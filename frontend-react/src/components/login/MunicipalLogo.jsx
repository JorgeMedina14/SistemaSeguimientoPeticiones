export function MunicipalLogo({ size = 'md', decorative = false }) {
  return (
    <img
      src="/logo-muni.png"
      className={`login-logo login-logo-${size}`}
      alt={decorative ? '' : 'Escudo de la Municipalidad de Jalapa'}
      aria-hidden={decorative || undefined}
    />
  );
}
