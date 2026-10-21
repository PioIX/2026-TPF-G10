// Tarjeta visual preparada para el menú; la página /menu actual construye sus cuatro tarjetas a mano.
import Link from "next/link";
import Image from "next/image";

export default function GameCard({ titulo, imagen, href }) {
  // next/image optimiza la imagen local y Link navega a la ruta del juego sin recarga completa.
  return (
    <div className="card">
      <Image src={imagen} alt="" width={240} height={140} className="card-img" />
      <h3>{titulo}</h3>
      <Link href={href} className="btn btn-primary">JUGAR</Link>
    </div>
  );
}
