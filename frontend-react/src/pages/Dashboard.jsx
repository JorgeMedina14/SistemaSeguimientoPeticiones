import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Clock3,
  Percent,
  TrendingUp,
  FileStack
} from 'lucide-react';
import {
  getCiudadanosFrecuentes,
  getDashboard,
  getPorDepartamento,
  getTiempos
} from '../api/reportesApi';
import { StatCard } from '../components/dashboard/StatCard';
import { DashboardSection } from '../components/dashboard/DashboardSection';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/FormFields';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Alert, Loader } from '../components/ui/Feedback';
import {
  formatDateTime,
  formatEstado,
  formatPercent,
  getApiError,
  getEstadoBadge,
  previousPeriod
} from '../utils/formatters';

export default function Dashboard() {
  const [filtros, setFiltros] = useState({ fechaInicio: '', fechaFin: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [tiempos, setTiempos] = useState(null);
  const [deptos, setDeptos] = useState([]);
  const [ciudadanos, setCiudadanos] = useState([]);

  const load = async (nextFiltros = filtros) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (nextFiltros.fechaInicio && nextFiltros.fechaFin) {
        params.fechaInicio = nextFiltros.fechaInicio;
        params.fechaFin = nextFiltros.fechaFin;
      }
      const prev = previousPeriod(nextFiltros.fechaInicio, nextFiltros.fechaFin);

      const [curRes, prevRes, tiemposRes, deptoRes, ciudadanosRes] = await Promise.all([
        getDashboard(params),
        getDashboard(prev),
        getTiempos(params),
        getPorDepartamento(params),
        getCiudadanosFrecuentes({ ...params, top: 10 })
      ]);

      setCurrent(curRes.data.data);
      setPrevious(prevRes.data.data);
      setTiempos(tiemposRes.data.data);
      setDeptos(deptoRes.data.data || []);
      setCiudadanos(ciudadanosRes.data.data || []);
    } catch (err) {
      setError(getApiError(err, 'No se pudo cargar el dashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pctRes = Number(current?.porcentajeResueltas) || 0;
  const pctPend = Number(current?.porcentajePendientes) || 0;
  const pctPrev = Number(previous?.porcentajeResueltas);
  const delta = Number.isFinite(pctPrev)
    ? `${pctRes - pctPrev >= 0 ? '+' : ''}${(pctRes - pctPrev).toFixed(1)}%`
    : '—';

  return (
    <div className="stack page-enter">
      <div className="page-header">
        <h1>Dashboard ejecutivo</h1>
        <p>Indicadores institucionales, tiempos de atención y actividad reciente</p>
      </div>

      <Card>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            load(filtros);
          }}
        >
          <Input
            id="fechaInicio"
            label="Fecha inicio"
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => setFiltros((f) => ({ ...f, fechaInicio: e.target.value }))}
          />
          <Input
            id="fechaFin"
            label="Fecha fin"
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => setFiltros((f) => ({ ...f, fechaFin: e.target.value }))}
          />
          <div className="form-group">
            <label className="sr-only">Acciones</label>
            <div className="form-actions-inline" aria-hidden="false">
              <Button type="submit" variant="primary">Filtrar</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const empty = { fechaInicio: '', fechaFin: '' };
                  setFiltros(empty);
                  load(empty);
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {error && <Alert type="error">{error}</Alert>}
      {loading ? (
        <Loader text="Cargando dashboard..." />
      ) : (
        <>
          <DashboardSection>
            <div className="metrics-grid metrics-5">
              <StatCard
                label="Total peticiones"
                value={current?.totalPeticiones ?? 0}
                icon={FileStack}
                tone="tone-navy"
              />
              <StatCard
                label="Resueltas"
                value={formatPercent(pctRes)}
                icon={Percent}
                tone="tone-navy"
              />
              <StatCard
                label="Pendientes"
                value={formatPercent(pctPend)}
                icon={Activity}
                tone="tone-slate"
              />
              <StatCard
                label="Promedio días"
                value={(Number(current?.promedioDiasResolucion) || 0).toFixed(1)}
                icon={Clock3}
                tone="tone-slate"
              />
              <StatCard
                label="Cambio % resueltas"
                value={delta}
                icon={TrendingUp}
                tone="tone-navy"
              />
            </div>
          </DashboardSection>

          <div className="grid-2">
            <DashboardSection>
              <Card title="Peticiones por estado">
                <Table
                  columns={[
                    {
                      key: 'estado',
                      label: 'Estado',
                      render: (r) => (
                        <Badge tone={getEstadoBadge(r.estado)}>{formatEstado(r.estado)}</Badge>
                      )
                    },
                    { key: 'total', label: 'Total' }
                  ]}
                  rows={current?.porEstado || []}
                />
              </Card>
            </DashboardSection>

            <DashboardSection>
              <Card title="Peticiones por departamento">
                <Table
                  columns={[
                    { key: 'departamento', label: 'Departamento' },
                    {
                      key: 'cantidadTotal',
                      label: 'Total',
                      render: (r) => r.cantidadTotal ?? r.total ?? 0
                    },
                    {
                      key: 'cantidadResueltas',
                      label: 'Resueltas',
                      render: (r) => r.cantidadResueltas ?? '—'
                    },
                    {
                      key: 'cantidadPendientes',
                      label: 'Pendientes',
                      render: (r) => r.cantidadPendientes ?? '—'
                    }
                  ]}
                  rows={deptos.length ? deptos : current?.porDepartamento || []}
                />
              </Card>
            </DashboardSection>

            <DashboardSection className="span-2">
              <Card title="Tiempos de resolución" className="span-2">
                <div className="metrics-grid metrics-4">
                  <StatCard label="Cerradas / resueltas" value={tiempos?.totalPeticionesCerradas ?? 0} icon={FileStack} />
                  <StatCard label="Promedio días" value={(Number(tiempos?.promedioDias) || 0).toFixed(1)} icon={Clock3} />
                  <StatCard label="Mínimo días" value={tiempos?.minimoDias ?? 0} />
                  <StatCard label="Máximo días" value={tiempos?.maximoDias ?? 0} />
                </div>
              </Card>
            </DashboardSection>

            <DashboardSection className="span-2">
              <Card title="Ciudadanos frecuentes">
                <Table
                  columns={[
                    { key: 'nombreCompleto', label: 'Ciudadano' },
                    { key: 'totalPeticiones', label: 'Peticiones' }
                  ]}
                  rows={ciudadanos.length ? ciudadanos : current?.top5CiudadanosFrecuentes || []}
                />
              </Card>
            </DashboardSection>

            <DashboardSection className="span-2">
              <Card title="Últimos movimientos" className="span-2">
                <Table
                  columns={[
                    { key: 'codigo', label: 'Código' },
                    {
                      key: 'estadoNuevo',
                      label: 'Estado',
                      render: (r) => (
                        <Badge tone={getEstadoBadge(r.estadoNuevo)}>{formatEstado(r.estadoNuevo)}</Badge>
                      )
                    },
                    {
                      key: 'comentario',
                      label: 'Comentario',
                      render: (r) => r.comentario || '—'
                    },
                    {
                      key: 'fechaMovimiento',
                      label: 'Fecha',
                      render: (r) => formatDateTime(r.fechaMovimiento)
                    },
                    {
                      key: 'acciones',
                      label: '',
                      render: (r) => (
                        <Link to={`/peticiones/${r.idPeticion}`}>
                          <Button size="sm" variant="outline">Ver</Button>
                        </Link>
                      )
                    }
                  ]}
                  rows={current?.ultimos10Movimientos || []}
                />
              </Card>
            </DashboardSection>
          </div>
        </>
      )}
    </div>
  );
}
