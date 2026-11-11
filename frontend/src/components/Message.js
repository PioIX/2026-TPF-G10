// Mensaje accesible reutilizable para pistas, errores, avisos e información de los juegos.
export default function Message({ children, tipo = "info", as: Tag = "div", className = "" }) {
  // Tag permite cambiar la etiqueta HTML sin duplicar el componente; tipo selecciona su estilo.
  const clases = ["mensaje", `mensaje-${tipo}`, className].filter(Boolean).join(" ");
  return <Tag className={clases} aria-live="polite">{children}</Tag>;
}
