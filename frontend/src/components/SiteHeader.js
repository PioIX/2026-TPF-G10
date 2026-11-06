"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const RUTAS_DE_JUEGO = [
  "/wordle",
  "/grid",
  "/fulbo11",
  "/adivinaeljugador",
];
// Avisa a React cuando cambia el localStorage desde otra pestaña.
function suscribirSesion(avisar) {
  window.addEventListener("storage", avisar);
  return () => window.removeEventListener("storage", avisar);
}
// En el navegador: hay sesión si existe usuarioId. En el servidor: nunca hay sesión.
const haySesion = () => window.localStorage.getItem("usuarioId") !== null;
const haySesionEnServidor = () => false;
export default function SiteHeader() {
  const rutaActual = usePathname() || "";
  const sesionIniciada = useSyncExternalStore(suscribirSesion, haySesion, haySesionEnServidor);
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
        {sesionIniciada && (
<Link className="siteHeaderPerfil" href="/perfil" aria-label="Mi perfil">
  <Image src="/perfil.png" alt="" width={32} height={32} />
</Link>
  
)}
      </nav>
    </header>
  );
}
