import { forwardRef } from 'react';

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size,
    block,
    type = 'button',
    className = '',
    ...props
  },
  ref
) {
  const normalized =
    variant === 'success' ? 'success-soft' :
    variant === 'danger' ? 'danger-soft' :
    variant;

  const classes = [
    'btn',
    `btn-${normalized}`,
    size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  );
});
