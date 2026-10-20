// Muestra la foto del jugador oscurecida hasta revelar su identidad.
// Silueta del jugador secreto: oscura hasta que se revela.
import Image from "next/image";

// Mantiene la foto tapada hasta que el juego revela la identidad.
export default function PlayerSilhouette({ imagen, revelado = false }) {
  return (
    <div className="silueta">
      {imagen
        ? <Image src={imagen} alt="" width={180} height={180} unoptimized style={{ filter: revelado ? "none" : "brightness(0)" }} />
        : "?"}
    </div>
  );
}
