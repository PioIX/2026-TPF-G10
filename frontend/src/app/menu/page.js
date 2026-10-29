"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import GameCard from "../../components/GameCard";
import GlobalChat from "../../components/GlobalChat";

const juegos = [
  { titulo: "Fulbo 11", imagen: "/fulbo11.png", href: "/fulbo11", detalle: "Completá tu equipo titular", estilo: "fulbo" },
  { titulo: "Wordle", imagen: "/wordle.png", href: "/wordle", detalle: "Adiviná el jugador", estilo: "wordle" },
  { titulo: "Grid", imagen: "/grid.png", href: "/grid", detalle: "Encontrá jugadores para cada cruce", estilo: "grid" },
  { titulo: "Adivina el jugador", imagen: "/adivinaeljugador.png", href: "/adivinaeljugador", detalle: "Descubrí al jugador oculto", estilo: "adivina" },
];

export default function MenuPage() {
  const router = useRouter();
  const [juegoSorpresa, setJuegoSorpresa] = useState(null);
  const [sorteando, setSorteando] = useState(false);
  const temporizadorSorpresa = useRef(null);

  // Cancela la navegación diferida si la persona elige otra opción antes de que termine el sorteo.
  useEffect(() => () => window.clearTimeout(temporizadorSorpresa.current), []);

  // Sección "Sorprendeme": elige un juego al azar, lo destaca y después lo abre.
  const sorprenderme = () => {
    if (sorteando) return;

    const elegido = juegos[Math.floor(Math.random() * juegos.length)];
    setJuegoSorpresa(elegido);
    setSorteando(true);

    const espera = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 150
      : 1050;
    temporizadorSorpresa.current = window.setTimeout(
      () => router.push(elegido.href),
      espera
    );
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("usuarioNombre");
    router.replace("/login");
  };

  return (
    <AuthGuard>
    <main className="menuPagina">
      <section className="menuHero" aria-labelledby="tituloMenu">
        <div>
          <h2 id="tituloMenu">Elegí un juego</h2>
          <p>Todos los desafíos de Fulbo 11, en un solo lugar.</p>
        </div>
      </section>

      {/* Sección interactiva separada: deja que la pelota elija por dónde arrancar. */}
      <section className={`sorpresaMenu ${sorteando ? "sorpresaMenuActiva" : ""}`} aria-label="Elegir un juego al azar">
        <div className="sorpresaMenuTexto" aria-live="polite">
          {juegoSorpresa ? (
            <>
              <strong>¡Hoy toca {juegoSorpresa.titulo}!</strong>
              <span>La pelota ya eligió.</span>
            </>
          ) : (
            <>
              <strong>¿No sabés cuál elegir?</strong>
              <span>Dejá que la pelota decida.</span>
            </>
          )}
        </div>
        <button className="sorpresaMenuBoton" type="button" onClick={sorprenderme} disabled={sorteando}>
          <span className="sorpresaMenuPelota" aria-hidden="true">⚽</span>
          {sorteando ? "¡Vamos!" : "Sorprendeme"}
        </button>
      </section>

      <div className="menuConChat">
        <section className="juegos" aria-label="Juegos disponibles">
          {juegos.map((juego) => (
            <GameCard
              key={juego.href}
              {...juego}
              sorteada={juegoSorpresa?.href === juego.href}
            />
          ))}
        </section>

        <GlobalChat />
      </div>

      <nav className="menuAcciones" aria-label="Otras opciones">
        <button type="button" className="menuAccion" onClick={cerrarSesion}>Cerrar sesión</button>
        <Link href="/admin" className="menuAccion menuAccionAdmin">Administración</Link>
      </nav>
    </main>
    </AuthGuard>
  );
}
