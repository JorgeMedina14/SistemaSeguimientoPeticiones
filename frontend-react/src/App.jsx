import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './styles/variables.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/login.css';
import './styles/buttons.css';
import './styles/badges.css';
import './styles/dashboard.css';
import './styles/components.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
