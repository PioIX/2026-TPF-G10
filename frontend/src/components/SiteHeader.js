"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// Rutas en las que el encabezado debe mostrar controles de navegación de partida.
const RUTAS_DE_JUEGO = [
  "/wordle",
  "/grid",
  "/fulbo11",
  "/adivinaeljugador",
  "/link",
];
// Avisa a React cuando cambia el localStorage desde otra pestaña.
// Escucha cambios de sesión entre pestañas y permite actualizar el encabezado al cerrar sesión.
function suscribirSesion(avisar) {
  window.addEventListener("storage", avisar);
  return () => window.removeEventListener("storage", avisar);
}
// En el navegador: solo hay sesión si quedó un ID numérico válido del backend.
// Consulta localStorage únicamente en el navegador para saber si hay una cuenta guardada.
const haySesion = () => {
  const usuarioId = Number(window.localStorage.getItem("usuarioId"));
  return Number.isSafeInteger(usuarioId) && usuarioId > 0;
};
// El servidor no puede leer localStorage; devuelve siempre el valor inicial para evitar hydration mismatch.
const haySesionEnServidor = () => false;
// Encabezado común: adapta los enlaces a la ruta actual y al estado de inicio de sesión.
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
          <Link className="siteHeaderLink" href={sesionIniciada ? "/menu" : "/login"}>
            {sesionIniciada ? "Menú de juegos" : "Iniciar sesión"}
          </Link>
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
