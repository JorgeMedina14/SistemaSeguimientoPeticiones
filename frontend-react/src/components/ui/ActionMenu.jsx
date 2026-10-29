import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronDown, Settings2 } from 'lucide-react';
import { Button } from './Button';

export function ActionMenu({ label = 'Configuraciones', items = [] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const visibleItems = items.filter((item) => !item.hidden);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 200;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8
    );
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 180 && rect.top > spaceBelow;
    setCoords({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      openUp
    });
  };

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();

    const onDoc = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const onReposition = () => updatePosition();

    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  if (!visibleItems.length) return null;

  return (
    <div className="action-menu">
      <Button
        ref={triggerRef}
        size="sm"
        variant="outline"
        className="action-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <Settings2 size={14} strokeWidth={2} />
        <span>{label}</span>
        <ChevronDown size={14} strokeWidth={2} className={open ? 'is-open' : ''} />
      </Button>

      {open &&
        createPortal(
          <div
            id={menuId}
            ref={menuRef}
            className={`action-menu-dropdown ${coords.openUp ? 'open-up' : ''}`.trim()}
            style={{ top: coords.top, left: coords.left }}
            role="menu"
          >
            {visibleItems.map((item) => {
              const className = [
                'action-menu-item',
                item.tone === 'danger' ? 'is-danger' : '',
                item.tone === 'success' ? 'is-success' : '',
                item.disabled ? 'is-disabled' : ''
              ]
                .filter(Boolean)
                .join(' ');

              const content = item.label;

              if (item.to && !item.disabled) {
                return (
                  <Link
                    key={item.key || item.label}
                    to={item.to}
                    className={className}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.key || item.label}
                  type="button"
                  className={className}
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    setOpen(false);
                    item.onClick?.();
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
