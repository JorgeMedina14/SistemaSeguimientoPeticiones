import { useEffect, useState } from 'react';
import {
  changePassword,
  createUsuario,
  deleteUsuario,
  listUsuarios,
  toggleUsuarioActivo,
  updateUsuario
} from '../api/usuariosApi';
import { listDepartamentos } from '../api/departamentosApi';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLES } from '../utils/roles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/FormFields';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ActionMenu } from '../components/ui/ActionMenu';
import { Alert, Loader } from '../components/ui/Feedback';
import { getApiError } from '../utils/formatters';

const emptyForm = {
  username: '',
  nombreCompleto: '',
  password: '',
  rol: 'RECEPCION',
  idDepartamento: ''
};

export default function Usuarios() {
  const { user, getError } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [deptos, setDeptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [passwordForm, setPasswordForm] = useState({ id: null, username: '', nuevaPassword: '', confirm: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, dRes] = await Promise.all([listUsuarios(), listDepartamentos()]);
      setUsuarios(uRes.data.data || []);
      setDeptos(dRes.data.data || []);
    } catch (err) {
      setError(getApiError(err, 'Error al cargar usuarios'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.idUsuario);
    setForm({
      username: row.username,
      nombreCompleto: row.nombreCompleto,
      password: '',
      rol: row.rol,
      idDepartamento: row.idDepartamento || ''
    });
    setModalOpen(true);
  };

  const saveUsuario = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await updateUsuario(editingId, {
          nombreCompleto: form.nombreCompleto,
          rol: form.rol,
          idDepartamento: form.rol === 'JEFE_DEPTO' ? Number(form.idDepartamento) : null
        });
        setMessage('Usuario actualizado');
      } else {
        await createUsuario({
          username: form.username,
          password: form.password,
          nombreCompleto: form.nombreCompleto,
          rol: form.rol,
          idDepartamento: form.rol === 'JEFE_DEPTO' ? Number(form.idDepartamento) : undefined
        });
        setMessage('Usuario creado');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getError(err, 'No se pudo guardar el usuario'));
    }
  };

  const handleToggle = async (row) => {
    try {
      await toggleUsuarioActivo(row.idUsuario, !row.activo);
      setMessage(`Usuario ${row.activo ? 'desactivado' : 'activado'}`);
      load();
    } catch (err) {
      setError(getError(err, 'No se pudo cambiar el estado'));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`¿Eliminar usuario ${row.username}?`)) return;
    try {
      await deleteUsuario(row.idUsuario);
      setMessage('Usuario eliminado');
      load();
    } catch (err) {
      setError(getError(err, 'No se pudo eliminar'));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (passwordForm.nuevaPassword !== passwordForm.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await changePassword(passwordForm.id, passwordForm.nuevaPassword);
      setMessage('Contraseña actualizada');
      setPasswordOpen(false);
    } catch (err) {
      setError(getError(err, 'No se pudo cambiar la contraseña'));
    }
  };

  return (
    <div className="stack page-enter">
      <div className="page-header page-header-split">
        <div>
          <h1>Usuarios</h1>
          <p>Administración de cuentas y roles</p>
        </div>
        <Button variant="accent" onClick={openCreate}>Nuevo usuario</Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table
            columns={[
              { key: 'username', label: 'Usuario' },
              { key: 'nombreCompleto', label: 'Nombre' },
              {
                key: 'rol',
                label: 'Rol',
                render: (r) => <Badge tone="info">{ROLE_LABELS[r.rol] || r.rol}</Badge>
              },
              {
                key: 'departamento',
                label: 'Departamento',
                render: (r) => r.departamentoNombre || r.departamento || '—'
              },
              {
                key: 'activo',
                label: 'Estado',
                render: (r) => (
                  <Badge tone={r.activo ? 'success' : 'danger'}>
                    {r.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                )
              },
              {
                key: 'acciones',
                label: 'Acciones',
                width: '160px',
                render: (r) => {
                  const isSelf = r.idUsuario === user?.idUsuario;
                  return (
                    <div className="table-actions">
                      <ActionMenu
                        items={[
                          {
                            key: 'editar',
                            label: 'Editar',
                            onClick: () => openEdit(r)
                          },
                          {
                            key: 'toggle',
                            label: r.activo ? 'Desactivar' : 'Activar',
                            tone: r.activo ? 'danger' : 'success',
                            disabled: isSelf,
                            onClick: () => handleToggle(r)
                          },
                          {
                            key: 'password',
                            label: 'Cambiar password',
                            onClick: () => {
                              setPasswordForm({
                                id: r.idUsuario,
                                username: r.username,
                                nuevaPassword: '',
                                confirm: ''
                              });
                              setPasswordOpen(true);
                            }
                          },
                          {
                            key: 'eliminar',
                            label: 'Eliminar',
                            tone: 'danger',
                            disabled: isSelf,
                            onClick: () => handleDelete(r)
                          }
                        ]}
                      />
                    </div>
                  );
                }
              }
            ]}
            rows={usuarios}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar usuario' : 'Nuevo usuario'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={saveUsuario}>
          {!editingId && (
            <>
              <Input
                id="username"
                label="Usuario"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
                minLength={4}
              />
              <Input
                id="password"
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </>
          )}
          <Input
            id="nombreCompleto"
            label="Nombre completo"
            value={form.nombreCompleto}
            onChange={(e) => setForm((f) => ({ ...f, nombreCompleto: e.target.value }))}
            required
          />
          <Select
            id="rol"
            label="Rol"
            value={form.rol}
            onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
          >
            {Object.keys(ROLES).map((rol) => (
              <option key={rol} value={rol}>{ROLE_LABELS[rol]}</option>
            ))}
          </Select>
          {form.rol === 'JEFE_DEPTO' && (
            <Select
              id="idDepartamento"
              label="Departamento"
              value={form.idDepartamento}
              onChange={(e) => setForm((f) => ({ ...f, idDepartamento: e.target.value }))}
              required
            >
              <option value="">Seleccione...</option>
              {deptos.map((d) => (
                <option key={d.idDepartamento} value={d.idDepartamento}>{d.nombre}</option>
              ))}
            </Select>
          )}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="accent">Guardar</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={passwordOpen}
        title={`Cambiar contraseña — ${passwordForm.username}`}
        onClose={() => setPasswordOpen(false)}
      >
        <form onSubmit={savePassword}>
          <Input
            id="nuevaPassword"
            label="Nueva contraseña"
            type="password"
            value={passwordForm.nuevaPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, nuevaPassword: e.target.value }))}
            required
            minLength={6}
          />
          <Input
            id="confirmPassword"
            label="Confirmar"
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
            required
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setPasswordOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="accent">Actualizar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
