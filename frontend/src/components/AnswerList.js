// Historial de Adivina el jugador con acción para destacar la respuesta más reciente.
export default function AnswerList({
  respuestas = [],
  onMarcar,
  juegoTerminado,
  id = "caja-respuestas",
  className = "caja-respuestas",
  buttonClassName = "btn btn-ghost",
}) {
  // `respuestas` llega con la más nueva primero; se limita la vista a las últimas diez.
  return (
    <div id={id} className={className}>
      {respuestas.length === 0 && <p className="vacio">Todavía no hiciste ninguna pregunta.</p>}
      {respuestas.slice(0, 10).map((t, i) => (
        <div key={i} className={`respuesta ${t.startsWith("🏁") ? "marcada" : ""}`}>{t}</div>
      ))}
      <button
        id="btn-marcar"
        type="button"
        className={buttonClassName}
        onClick={onMarcar}
        disabled={juegoTerminado || respuestas.length === 0}
      >
        🏁 Marcar respuesta
      </button>
    </div>
  );
}
