import Link from "next/link";
import Image from "next/image";

// Íconos vectoriales propios: conservan el contraste sobre césped sin placas ni fondos negros.
function IconoJuego({ estilo }) {
  const props = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2.4,
  };

  const iconos = {
    fulbo: <><circle cx="32" cy="32" r="23" /><path d="m32 20 8 6-3 10h-10l-3-10 8-6Zm-8 6-9-2m22 2 10-2M27 36l-5 12m15-12 5 12M24 48l-10 5m26-5 10 5" /></>,
    wordle: <><rect x="10" y="13" width="13" height="13" rx="3" /><rect x="26" y="13" width="13" height="13" rx="3" /><rect x="42" y="13" width="13" height="13" rx="3" /><rect x="10" y="30" width="13" height="13" rx="3" /><rect x="26" y="30" width="13" height="13" rx="3" /><rect x="42" y="30" width="13" height="13" rx="3" /><path d="M15 50h34" /></>,
    grid: <><rect x="11" y="11" width="42" height="42" rx="6" /><path d="M25 11v42M39 11v42M11 25h42M11 39h42" /><path d="M32 25v14m-7-7h14" /></>,
    adivina: <><circle cx="28" cy="24" r="10" /><path d="M9 53c2-10 9-15 19-15 5 0 9 1 12 4" /><circle cx="45" cy="43" r="9" /><path d="m51 50 7 7" /></>,
    link: <><path d="m26 39-4 4a10 10 0 0 1-14-14l9-9a10 10 0 0 1 14 0" /><path d="m38 25 4-4a10 10 0 0 1 14 14l-9 9a10 10 0 0 1-14 0" /><path d="m23 41 18-18" /></>,
    quienmas: <><path d="M12 52V32h10v20M27 52V18h10v34M42 52V26h10v26M8 56h48" /><path d="m18 24 10-8 9 4 11-10" /></>,
  };

  return <svg className="juegoTarjetaIcono" viewBox="0 0 64 64" aria-hidden="true" {...props}>{iconos[estilo] || iconos.fulbo}</svg>;
}

// Tarjeta del menú: la cancha ocupa todo el botón y el ícono queda transparente sobre el césped.
export default function GameCard({ titulo, detalle, imagen, href, estilo, sorteada = false }) {
  return (
    <Link
      className={`juegoTarjeta juegoTarjeta-${estilo || "default"} ${sorteada ? "juegoTarjetaSorteada" : ""}`}
      href={href}
    >
      <span className="juegoTarjetaCancha" aria-hidden="true">
        <span className="juegoCanchaLineaCentral" />
        <span className="juegoCanchaCirculoCentral" />
        <span className="juegoCanchaPuntoCentral" />
        <span className="juegoCanchaArea juegoCanchaAreaIzquierda" />
        <span className="juegoCanchaArea juegoCanchaAreaDerecha" />
        <span className="juegoCanchaAreaChica juegoCanchaAreaChicaIzquierda" />
        <span className="juegoCanchaAreaChica juegoCanchaAreaChicaDerecha" />
        <span className="juegoTarjetaPelota" />
      </span>
      <span className="juegoTarjetaImagen"><Image src={imagen} alt="" width={240} height={240} loading={imagen === "/fulbo11.png" ? "eager" : "lazy"} /><span className="juegoTarjetaIconoFallback"><IconoJuego estilo={estilo} /></span></span>
      <span className="juegoTarjetaInfo">
        <span className="juegoTarjetaTitulo">{titulo}</span>
        <span className="juegoTarjetaDetalle">{detalle}</span>
        <span className="juegoTarjetaAccion">Jugar <span aria-hidden="true">↗</span></span>
      </span>
    </Link>
  );
}
