import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPeticion } from '../api/peticionesApi';
import { listDepartamentos } from '../api/departamentosApi';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, TextArea } from '../components/ui/FormFields';
import { Alert, Loader } from '../components/ui/Feedback';
import { PRIORIDADES, formatPrioridad, getApiError } from '../utils/formatters';

const initial = {
  dpi: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  correo: '',
  direccion: '',
  titulo: '',
  descripcion: '',
  prioridad: 'MEDIA',
  idDepartamento: ''
};

export default function NuevaPeticion() {
  const navigate = useNavigate();
  const { getError } = useAuth();
  const [form, setForm] = useState(initial);
  const [deptos, setDeptos] = useState([]);
  const [loadingDeptos, setLoadingDeptos] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await listDepartamentos();
        setDeptos(res.data.data || []);
      } catch (err) {
        setError(getApiError(err, 'No se pudieron cargar departamentos'));
      } finally {
        setLoadingDeptos(false);
      }
    })();
  }, []);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{13}$/.test(form.dpi)) {
      setError('El DPI debe tener exactamente 13 dígitos');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ciudadano: {
          dpi: form.dpi,
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          telefono: form.telefono.trim() || undefined,
          correo: form.correo.trim() || undefined,
          direccion: form.direccion.trim() || undefined
        },
        peticion: {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          prioridad: form.prioridad
        },
        idDepartamento: Number(form.idDepartamento)
      };
      const res = await createPeticion(payload);
      const id = res.data.data?.idPeticion;
      navigate(id ? `/peticiones/${id}` : '/peticiones');
    } catch (err) {
      setError(getError(err, 'No se pudo registrar la petición'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDeptos) return <Loader text="Cargando formulario..." />;

  return (
    <div className="stack page-enter">
      <div className="page-header">
        <h1>Nueva petición</h1>
        <p>Registro de solicitud ciudadana</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <Card>
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '1rem' }}>Datos del ciudadano</h3>
          <div className="form-row">
            <Input id="dpi" label="DPI (13 dígitos)" value={form.dpi} onChange={setField('dpi')} required maxLength={13} />
            <Input id="nombres" label="Nombres" value={form.nombres} onChange={setField('nombres')} required />
            <Input id="apellidos" label="Apellidos" value={form.apellidos} onChange={setField('apellidos')} required />
            <Input id="telefono" label="Teléfono" value={form.telefono} onChange={setField('telefono')} />
            <Input id="correo" label="Correo" type="email" value={form.correo} onChange={setField('correo')} />
            <Input id="direccion" label="Dirección" value={form.direccion} onChange={setField('direccion')} />
          </div>

          <h3 style={{ margin: '1.5rem 0 1rem' }}>Datos de la petición</h3>
          <Input id="titulo" label="Título" value={form.titulo} onChange={setField('titulo')} required />
          <TextArea id="descripcion" label="Descripción" rows={5} value={form.descripcion} onChange={setField('descripcion')} required />
          <div className="form-row">
            <Select id="prioridad" label="Prioridad" value={form.prioridad} onChange={setField('prioridad')}>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>{formatPrioridad(p)}</option>
              ))}
            </Select>
            <Select
              id="idDepartamento"
              label="Departamento"
              value={form.idDepartamento}
              onChange={setField('idDepartamento')}
              required
            >
              <option value="">Seleccione...</option>
              {deptos.map((d) => (
                <option key={d.idDepartamento} value={d.idDepartamento}>{d.nombre}</option>
              ))}
            </Select>
          </div>

          <div className="form-actions">
            <Link to="/peticiones"><Button type="button" variant="secondary">Cancelar</Button></Link>
            <Button type="submit" variant="accent" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Registrar petición'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
