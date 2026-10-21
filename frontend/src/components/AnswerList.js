// Lista las preguntas respondidas y permite marcar la respuesta final.
// respuestas: array de textos (el más nuevo primero), como en adivinaeljugador.js.
// Los que empiezan con 🏁 se muestran como marcados. Muestra las últimas 10.
export default function AnswerList({ respuestas, onMarcar, juegoTerminado }) {
  return (
    <div className="caja-respuestas">
      {respuestas.length === 0 && <p className="vacio">Todavía no hiciste ninguna pregunta.</p>}
      {respuestas.slice(0, 10).map((t, i) => (
        <div key={i} className={`respuesta ${t.startsWith("🏁") ? "marcada" : ""}`}>{t}</div>
      ))}
      <button className="btn btn-ghost" onClick={onMarcar} disabled={juegoTerminado || respuestas.length === 0}>
        🏁 Marcar respuesta
      </button>
    </div>
  );
}