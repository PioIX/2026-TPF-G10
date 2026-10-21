// Título común disponible para encabezados; Header lo reutiliza cuando ese componente se usa.
export default function Title({ children, nivel = 1 }) {
  const Tag = `h${nivel}`;
  return <Tag className={`title title-${nivel}`}>{children}</Tag>;
}
