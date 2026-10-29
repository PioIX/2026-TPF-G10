// Mensaje accesible reutilizable en pistas y respuestas del juego.
export default function Message({ children, tipo = "info", as: Tag = "div", className = "" }) {
  const clases = ["mensaje", `mensaje-${tipo}`, className].filter(Boolean).join(" ");
  return <Tag className={clases} aria-live="polite">{children}</Tag>;
}
