// Pantalla de resultado preparada; actualmente ninguna página de juego la importa.
import Button from "./Button";

// Presenta el resultado y delega reiniciar o navegar al menú a sus props.
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
