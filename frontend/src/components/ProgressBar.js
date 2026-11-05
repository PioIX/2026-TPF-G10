// Barra accesible para mostrar el avance de una partida.
export default function ProgressBar({
  valor,
  total,
  texto,
  className = "barraProgreso",
  fillClassName = "rellenoProgreso",
  textClassName = "textoProgreso",
  textId,
}) {
  const porcentaje = total > 0 ? Math.round((valor / total) * 100) : 0;

  return (
    <>
      <div
        className={className}
        role="progressbar"
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div className={fillClassName} style={{ width: `${porcentaje}%` }} />
      </div>
      {texto && <div id={textId} className={textClassName}>{texto}</div>}
    </>
  );
}
