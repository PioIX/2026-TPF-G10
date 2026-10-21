// Resumen reutilizable del resultado con acciones para reiniciar o volver.
import Button from "./Button";

// Pantalla de fin de partida, la usan todos los juegos.
export default function ResultCard({ gano, titulo, detalle, onReiniciar }) {
  return (
    <div className={`result ${gano ? "result-ok" : "result-mal"}`}>
      <h2>{titulo ?? (gano ? "¡Ganaste!" : "Perdiste")}</h2>
      {detalle && <p>{detalle}</p>}
      <div className="result-acciones">
        <Button onClick={onReiniciar}>Jugar de nuevo</Button>
        <Button href="/menu" variant="ghost">Volver al menú</Button>
      </div>
    </div>
  );
}
