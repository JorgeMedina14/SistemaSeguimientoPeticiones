function Field({ label, id, children }) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      {children}
    </div>
  );
}

export function Input({ label, id, error, ...props }) {
  return (
    <Field label={label} id={id}>
      <input id={id} className="form-control" {...props} />
      {error && <small className="text-muted" style={{ color: 'var(--color-danger-text)' }}>{error}</small>}
    </Field>
  );
}

export function Select({ label, id, children, ...props }) {
  return (
    <Field label={label} id={id}>
      <select id={id} className="form-control" {...props}>
        {children}
      </select>
    </Field>
  );
}

export function TextArea({ label, id, ...props }) {
  return (
    <Field label={label} id={id}>
      <textarea id={id} className="form-control" {...props} />
    </Field>
  );
}
