// Barra accesible que visualiza el avance numérico de una partida.
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
