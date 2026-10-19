// Silueta del jugador secreto: oscura hasta que se revela.
export default function PlayerSilhouette({ imagen, revelado = false }) {
  return (
    <div className="silueta">
      {imagen
        ? <img src={imagen} alt="" style={{ filter: revelado ? "none" : "brightness(0)" }} />
        : "?"}
    </div>
  );
}
