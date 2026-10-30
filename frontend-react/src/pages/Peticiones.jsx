import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPeticiones, deletePeticion } from '../api/peticionesApi';
import { useAuth } from '../context/AuthContext';
import { canCreatePeticion, canDeletePeticion } from '../utils/roles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/FormFields';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { ActionMenu } from '../components/ui/ActionMenu';
import { Alert, Loader } from '../components/ui/Feedback';
import {
  ESTADOS,
  PRIORIDADES,
  formatDate,
  formatEstado,
  formatPrioridad,
  getApiError,
  getEstadoBadge,
  getPrioridadBadge
} from '../utils/formatters';

const emptyFilters = { q: '', estado: '', prioridad: '' };

export default function Peticiones() {
  const { user, getError } = useAuth();
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async (nextPage = page, nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: nextPage, limit: 10 };
      if (nextFilters.q) params.q = nextFilters.q;
      if (nextFilters.estado) params.estado = nextFilters.estado;
      if (nextFilters.prioridad) params.prioridad = nextFilters.prioridad;
      const res = await listPeticiones(params);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || nextPage);
    } catch (err) {
      setError(getApiError(err, 'Error al cargar peticiones'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (row) => {
    if (!window.confirm(`¿Eliminar la petición ${row.codigo || row.idPeticion}?`)) return;
    try {
      await deletePeticion(row.idPeticion);
      setMessage('Petición eliminada correctamente');
      load(page, filters);
    } catch (err) {
      setError(getError(err, 'No se pudo eliminar'));
    }
  };

  return (
    <div className="stack page-enter">
      <div className="page-header page-header-split">
        <div>
          <h1>Peticiones</h1>
          <p>Consulta, filtro y seguimiento de solicitudes ciudadanas</p>
        </div>
        {canCreatePeticion(user?.rol) && (
          <Link to="/peticiones/nueva">
            <Button variant="accent">Nueva petición</Button>
          </Link>
        )}
      </div>

      <Card>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            load(1, filters);
          }}
        >
          <Input
            id="q"
            label="Buscar (código, título, DPI)"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <Select
            id="estado"
            label="Estado"
            value={filters.estado}
            onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{formatEstado(e)}</option>
            ))}
          </Select>
          <Select
            id="prioridad"
            label="Prioridad"
            value={filters.prioridad}
            onChange={(e) => setFilters((f) => ({ ...f, prioridad: e.target.value }))}
          >
            <option value="">Todas</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{formatPrioridad(p)}</option>
            ))}
          </Select>
          <div className="form-group">
            <label className="sr-only">Acciones</label>
            <div className="form-actions-inline">
              <Button type="submit">Buscar</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFilters(emptyFilters);
                  load(1, emptyFilters);
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {error && <Alert type="error">{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <Card title={`Listado (${total})`}>
        {loading ? (
          <Loader />
        ) : (
          <>
            <Table
              columns={[
                { key: 'codigo', label: 'Código', render: (r) => r.codigo || r.codigoPeticion || '—' },
                { key: 'titulo', label: 'Título' },
                {
                  key: 'estado',
                  label: 'Estado',
                  render: (r) => <Badge tone={getEstadoBadge(r.estado)}>{formatEstado(r.estado)}</Badge>
                },
                {
                  key: 'prioridad',
                  label: 'Prioridad',
                  render: (r) => <Badge tone={getPrioridadBadge(r.prioridad)}>{formatPrioridad(r.prioridad)}</Badge>
                },
                { key: 'departamento', label: 'Departamento', render: (r) => r.departamento || '—' },
                { key: 'fechaCreacion', label: 'Fecha', render: (r) => formatDate(r.fechaCreacion) },
                {
                  key: 'acciones',
                  label: 'Acciones',
                  render: (r) => (
                    <div className="table-actions">
                      <ActionMenu
                        items={[
                          {
                            key: 'editar',
                            label: 'Editar',
                            to: `/peticiones/${r.idPeticion}`
                          },
                          {
                            key: 'eliminar',
                            label: 'Eliminar',
                            tone: 'danger',
                            hidden: !canDeletePeticion(user?.rol),
                            onClick: () => handleDelete(r)
                          }
                        ]}
                      />
                    </div>
                  )
                }
              ]}
              rows={data}
            />
            <div className="pagination">
              <span className="text-muted">Página {page} de {totalPages}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => load(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
