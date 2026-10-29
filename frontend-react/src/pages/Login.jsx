import { useEffect, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstitutionalPanel } from '../components/login/InstitutionalPanel';
import { LoginForm } from '../components/login/LoginForm';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, getError } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleLogin = async ({ username, password }) => {
    setError('');
    setSubmitting(true);
    try {
      const { home } = await login(username, password);
      startTransition(() => navigate(home, { replace: true }));
      return true;
    } catch (err) {
      setError(getError(err, 'Credenciales inválidas'));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`login-page ${ready ? 'is-ready' : ''}`.trim()}>
      <section className="login-side">
        <LoginForm onSubmit={handleLogin} error={error} busy={submitting || isPending} />
      </section>
      <InstitutionalPanel />
    </div>
  );
}
