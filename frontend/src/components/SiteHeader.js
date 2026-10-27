"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const RUTAS_DE_JUEGO = [
  "/wordle",
  "/grid",
  "/fulbo11",
  "/adivinaeljugador",
];

export default function SiteHeader() {
  const rutaActual = usePathname() || "";
  const estaEnJuego = RUTAS_DE_JUEGO.some(
    (ruta) => rutaActual === ruta || rutaActual.startsWith(`${ruta}/`)
  );
  const estaEnMenu = rutaActual === "/menu";
  const destinoLogo = estaEnJuego ? "/menu" : "/";

  return (
    <header className="siteHeader">
      <Link
        className="siteHeaderMarca"
        href={destinoLogo}
        aria-label={estaEnJuego ? "Fulbo 11, volver al menú" : "Fulbo 11, ir al inicio"}
      >
        <span className="siteHeaderLogo">
          <Image src="/logo.png" alt="" width={48} height={48} priority />
        </span>
        <span className="siteHeaderTexto">
          <span className="siteHeaderNombre">FULBO 11</span>
          <span className="siteHeaderSubtitulo">Minijuegos de fútbol</span>
        </span>
      </Link>

      <nav className="siteHeaderNav" aria-label="Navegación principal">
        {estaEnMenu ? (
          <Link className="siteHeaderLink" href="/">Inicio</Link>
        ) : (
          <Link className="siteHeaderLink" href="/menu">Menú de juegos</Link>
        )}
      </nav>
    </header>
  );
}
