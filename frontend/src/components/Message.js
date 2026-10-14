export default function Message({ children, tipo = "info" }) {
  return <div className={`mensaje mensaje-${tipo}`} aria-live="polite">{children}</div>;
}
