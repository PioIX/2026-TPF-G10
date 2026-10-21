// Barra accesible reutilizable; los juegos activos calculan sus barras dentro de cada página.
export default function ProgressBar({ valor, total, texto }) {
  return (
    <>
      <div className="barra" role="progressbar" aria-valuenow={valor} aria-valuemax={total}>
        <div className="relleno" style={{ width: `${Math.round((valor / total) * 100)}%` }} />
      </div>
      {texto && <div className="progreso-texto">{texto}</div>}
    </>
  );
}
