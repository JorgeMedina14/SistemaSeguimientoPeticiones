import { useEffect, useId, useRef, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, Lock, LogIn, ShieldCheck, User } from 'lucide-react';
import { LoginField } from './LoginField';
import { MunicipalLogo } from './MunicipalLogo';
import { SectionDivider } from './SectionDivider';

const REMEMBER_KEY = 'rememberedUsername';

export function LoginForm({ onSubmit, error, busy }) {
  const userId = useId();
  const passId = useId();
  const userRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      setUsername(remembered);
      setRemember(true);
    }
    userRef.current?.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!username.trim() || !password) {
      setFormError('Ingrese su usuario y contraseña.');
      return;
    }

    const succeeded = await onSubmit({ username: username.trim(), password });

    if (succeeded) {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, username.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    }
  };

  const visibleError = formError || error;

  return (
    <div className="login-form">
      <header className="login-brand">
        <MunicipalLogo size="md" />
        <h1>
          <span>Sistema de</span>
          Peticiones Ciudadanas
        </h1>
        <SectionDivider tone="navy" />
        <p className="login-brand-sub">Municipalidad de Jalapa</p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        {visibleError && (
          <p className="login-alert" role="alert">
            {visibleError}
          </p>
        )}

        <LoginField
          id={userId}
          label="Usuario"
          icon={User}
          inputRef={userRef}
          type="text"
          placeholder="Ingrese su usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          disabled={busy}
        />

        <LoginField
          id={passId}
          label="Contraseña"
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          placeholder="Ingrese su contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={busy}
          action={
            <button
              type="button"
              className="login-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
            >
              <span key={String(showPassword)} className="login-toggle-icon">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </button>
          }
        />

        <div className="login-options">
          <label className="login-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={busy}
            />
            Recordar usuario
          </label>
          <span className="login-forgot">¿Olvidó su contraseña?</span>
        </div>

        <button type="submit" className="login-submit" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle size={18} className="login-spinner" />
              Verificando
            </>
          ) : (
            <>
              <LogIn size={18} />
              Iniciar sesión
            </>
          )}
        </button>
      </form>

      <footer className="login-support">
        <SectionDivider tone="soft">
          <ShieldCheck size={15} />
        </SectionDivider>
        <p>
          ¿Necesita ayuda? Contáctese con la{' '}
          <strong>Unidad de Informática Municipal.</strong>
        </p>
      </footer>
    </div>
  );
}
