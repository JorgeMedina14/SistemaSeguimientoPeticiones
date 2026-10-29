import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="fallback-page">
      <div className="fallback-card text-center">
        <h1>404</h1>
        <p>La página solicitada no existe.</p>
        <Link to="/"><Button>Ir al inicio</Button></Link>
      </div>
    </div>
  );
}
