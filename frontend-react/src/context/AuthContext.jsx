import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, loginRequest } from '../api/authApi';
import { getApiError } from '../utils/formatters';
import { getHomePath } from '../utils/roles';

const AuthContext = createContext(null);

function normalizeUser(raw) {
  if (!raw) return null;
  const data = raw.data || raw;
  return {
    idUsuario: data.idUsuario,
    username: data.username,
    nombre: data.nombreCompleto || data.nombre || data.username,
    nombreCompleto: data.nombreCompleto || data.nombre,
    rol: data.rol,
    idDepartamento: data.idDepartamento ?? null,
    activo: data.activo ?? true
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return null;
    }
    try {
      const { data } = await getMe();
      const normalized = normalizeUser(data);
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
      return normalized;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (username, password) => {
    const { data } = await loginRequest(username, password);
    if (!data?.success || !data?.data?.token) {
      throw new Error(data?.message || 'No se pudo iniciar sesión');
    }
    const nextToken = data.data.token;
    const normalized = normalizeUser(data.data.user);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(normalized));
    setToken(nextToken);
    setUser(normalized);
    return { user: normalized, home: getHomePath(normalized.rol) };
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      refreshUser,
      getError: getApiError
    }),
    [user, token, loading, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
