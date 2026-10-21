// Mensaje accesible reutilizable, usado por ClueBox y CellSearchPanel.
export default function Message({ children, tipo = "info" }) {
  return <div className={`mensaje mensaje-${tipo}`} aria-live="polite">{children}</div>;
}
