import Link from "next/link";
import Image from "next/image";

// Tarjeta del menú con la ruta y los datos de presentación de cada juego.
export default function GameCard({
  titulo,
  detalle,
  imagen,
  href,
  estilo,
  sorteada = false,
}) {
  return (
    <Link
      className={`juegoTarjeta juegoTarjeta-${estilo || "default"} ${sorteada ? "juegoTarjetaSorteada" : ""}`}
      href={href}
    >
      <span className="juegoTarjetaImagen">
        <Image src={imagen} alt="" width={240} height={240} />
      </span>
      <span className="juegoTarjetaInfo">
        <span className="juegoTarjetaTitulo">{titulo}</span>
        <span className="juegoTarjetaDetalle">{detalle}</span>
        <span className="juegoTarjetaAccion">
          <span className="juegoTarjetaBalon" aria-hidden="true">⚽</span>
          Jugar
        </span>
      </span>
    </Link>
  );
}
