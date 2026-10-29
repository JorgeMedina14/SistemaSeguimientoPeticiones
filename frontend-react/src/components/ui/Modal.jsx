import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header>
          <h3>{title}</h3>
          <Button variant="outline" size="sm" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </Button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
