import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deletePeticion, getPeticion, updateEstado } from '../api/peticionesApi';
import { useAuth } from '../context/AuthContext';
import { canChangeEstado, canDeletePeticion } from '../utils/roles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select, TextArea } from '../components/ui/FormFields';
import { Badge } from '../components/ui/Badge';
import { ActionMenu } from '../components/ui/ActionMenu';
import { Alert, Loader } from '../components/ui/Feedback';
import {
  ESTADOS,
  formatDate,
  formatDateTime,
  formatEstado,
  formatPrioridad,
  getApiError,
  getEstadoBadge,
  getPrioridadBadge
} from '../utils/formatters';

export default function PeticionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getError } = useAuth();
  const [peticion, setPeticion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [estadoNuevo, setEstadoNuevo] = useState('');
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPeticion(id);
      setPeticion(res.data.data);
      setEstadoNuevo('');
      setComentario('');
    } catch (err) {
      setError(getApiError(err, 'No se pudo cargar la petición'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEstado = async (e) => {
    e.preventDefault();
    if (!estadoNuevo) {
      setError('Seleccione un estado nuevo');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateEstado(id, {
        estadoNuevo,
        comentario: comentario.trim() || undefined
      });
      setMessage('Estado actualizado y seguimiento registrado');
      await load();
    } catch (err) {
      setError(getError(err, 'No se pudo actualizar el estado'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta petición?')) return;
    try {
      await deletePeticion(id);
      navigate('/peticiones');
    } catch (err) {
      setError(getError(err, 'No se pudo eliminar'));
    }
  };

  if (loading) return <Loader text="Cargando detalle..." />;
  if (!peticion) {
    return (
      <div className="stack">
        {error && <Alert type="error">{error}</Alert>}
        <Link to="/peticiones"><Button variant="secondary">Volver</Button></Link>
      </div>
    );
  }

  const cerrado = peticion.estado === 'CERRADA';
  const puedeEditarEstado = canChangeEstado(user?.rol) && !cerrado;

  return (
    <div className="stack page-enter">
      <div className="page-header page-header-split">
        <div>
          <h1>{peticion.codigo || `Petición #${peticion.idPeticion}`}</h1>
          <p>{peticion.titulo}</p>
        </div>
        <div className="page-header-actions">
          <Link to="/peticiones"><Button variant="secondary">Volver</Button></Link>
          {canDeletePeticion(user?.rol) && (
            <ActionMenu
              items={[
                {
                  key: 'eliminar',
                  label: 'Eliminar petición',
                  tone: 'danger',
                  onClick: handleDelete
                }
              ]}
            />
          )}
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <div className="detail-grid">
        <Card title="Información general">
          <div className="detail-row"><span>Estado</span><Badge tone={getEstadoBadge(peticion.estado)}>{formatEstado(peticion.estado)}</Badge></div>
          <div className="detail-row"><span>Prioridad</span><Badge tone={getPrioridadBadge(peticion.prioridad)}>{formatPrioridad(peticion.prioridad)}</Badge></div>
          <div className="detail-row"><span>Departamento</span><span>{peticion.departamento?.nombre || peticion.departamento || '—'}</span></div>
          <div className="detail-row"><span>Creación</span><span>{formatDate(peticion.fechaCreacion)}</span></div>
          <div className="detail-row"><span>Descripción</span></div>
          <p style={{ marginTop: '0.5rem' }}>{peticion.descripcion}</p>
        </Card>

        <Card title="Ciudadano">
          <div className="detail-row"><span>DPI</span><span>{peticion.ciudadano?.dpi || peticion.dpi || '—'}</span></div>
          <div className="detail-row"><span>Nombre</span><span>
            {peticion.ciudadano
              ? `${peticion.ciudadano.nombres || ''} ${peticion.ciudadano.apellidos || ''}`.trim()
              : peticion.ciudadanoNombre || '—'}
          </span></div>
          <div className="detail-row"><span>Teléfono</span><span>{peticion.ciudadano?.telefono || '—'}</span></div>
          <div className="detail-row"><span>Correo</span><span>{peticion.ciudadano?.correo || '—'}</span></div>
          <div className="detail-row"><span>Dirección</span><span>{peticion.ciudadano?.direccion || '—'}</span></div>
        </Card>
      </div>

      {puedeEditarEstado && (
        <Card title="Actualizar estado / seguimiento">
          <form onSubmit={handleEstado}>
            <Select
              id="estadoNuevo"
              label="Nuevo estado"
              value={estadoNuevo}
              onChange={(e) => setEstadoNuevo(e.target.value)}
              required
            >
              <option value="">Seleccione...</option>
              {ESTADOS.filter((e) => e !== peticion.estado).map((e) => (
                <option key={e} value={e}>{formatEstado(e)}</option>
              ))}
            </Select>
            <TextArea
              id="comentario"
              label="Comentario de seguimiento"
              rows={4}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Describa el avance o motivo del cambio"
            />
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar seguimiento'}
            </Button>
          </form>
        </Card>
      )}

      <Card title="Historial de seguimientos">
        {!peticion.historial?.length ? (
          <p className="text-muted">Sin seguimientos registrados.</p>
        ) : (
          <div className="timeline">
            {peticion.historial.map((item) => (
              <div key={item.idSeguimiento} className="timeline-item">
                <div className="timeline-head">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge tone={getEstadoBadge(item.estadoAnterior)}>{formatEstado(item.estadoAnterior)}</Badge>
                    <span>→</span>
                    <Badge tone={getEstadoBadge(item.estadoNuevo)}>{formatEstado(item.estadoNuevo)}</Badge>
                  </div>
                  <span className="text-muted">{formatDateTime(item.fechaMovimiento)}</span>
                </div>
                <p style={{ marginTop: '0.75rem' }}>{item.comentario || 'Sin comentario'}</p>
                <small className="text-muted">Por: {item.usuario || 'Sistema'}</small>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
