export function LoginField({ id, label, icon: Icon, action, inputRef, ...inputProps }) {
  return (
    <div className="login-field">
      <label htmlFor={id}>{label}</label>
      <div className="login-input">
        <Icon size={18} aria-hidden="true" />
        <input id={id} ref={inputRef} {...inputProps} />
        {action}
      </div>
    </div>
  );
}
