// Silueta reutilizable de jugador; la ruta de Adivina el jugador actual renderiza la imagen directamente.
import Image from "next/image";

// Solo presenta la foto; el estado revelado llega como prop desde la lógica de la partida.
export default function PlayerSilhouette({ imagen, revelado = false }) {
  return (
    <div className="silueta">
      {imagen
        ? <Image src={imagen} alt="" width={180} height={180} unoptimized style={{ filter: revelado ? "none" : "brightness(0)" }} />
        : "?"}
    </div>
  );
}
