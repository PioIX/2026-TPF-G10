// Título semántico configurable entre los niveles h1 y h6.
export default function Title({ children, nivel = 1 }) {
  const Tag = `h${nivel}`;
  return <Tag className={`title title-${nivel}`}>{children}</Tag>;
}
