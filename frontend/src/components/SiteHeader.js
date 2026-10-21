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

// Uso: encabezado global. Desde un minijuego vuelve al menú y en las demás rutas conserva el inicio.
export default function SiteHeader() {
  const rutaActual = usePathname() || "";
  const estaEnJuego = RUTAS_DE_JUEGO.some(
    (ruta) => rutaActual === ruta || rutaActual.startsWith(`${ruta}/`)
  );

  return (
    <header>
      <h1>FULBO 11</h1>
      <Link
        href={estaEnJuego ? "/menu" : "/"}
        aria-label={estaEnJuego ? "Volver al menú" : "Volver al inicio"}
      >
        {/* El logo aparece al inicio de la página y se descarga de forma prioritaria. */}
        <Image
          src="/logo.png"
          alt="Logo Fulbo 11"
          width={80}
          height={80}
          loading="eager"
        />
      </Link>
    </header>
  );
}
