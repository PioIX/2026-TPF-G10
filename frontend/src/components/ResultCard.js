import Button from "./Button";

// Resultado compartido al terminar una partida, con acciones para reiniciar o volver al menú.
export default function ResultCard({ gano, titulo, detalle, onReiniciar, className = "" }) {
  return (
    <section className={`result ${gano ? "result-ok" : "result-mal"} ${className}`.trim()} aria-live="polite">
      <h2>{titulo ?? (gano ? "¡Ganaste!" : "Perdiste")}</h2>
      {detalle && <p>{detalle}</p>}
      <div className="result-acciones">
        <Button type="button" onClick={onReiniciar}>Jugar de nuevo</Button>
        <Button href="/menu" variant="ghost">Volver al menú</Button>
      </div>
    </section>
  );
}
