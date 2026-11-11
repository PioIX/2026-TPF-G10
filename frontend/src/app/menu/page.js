"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import GameCard from "../../components/GameCard";
import GlobalChat from "../../components/GlobalChat";
import LogrosPanel from "../../components/LogrosPanel";

// Catálogo que alimenta las tarjetas y el selector aleatorio de juegos del menú.
const juegos = [
  { titulo: "Fulbo 11", imagen: "/fulbo11.png", href: "/fulbo11", detalle: "Completá tu equipo titular", estilo: "fulbo" },
  { titulo: "Wordle", imagen: "/wordle.png", href: "/wordle", detalle: "Descifrá el jugador", estilo: "wordle" },
  { titulo: "Grid", imagen: "/grid.png", href: "/grid", detalle: "Encontrá jugadores para cada cruce", estilo: "grid" },
  { titulo: "Adivina el jugador", imagen: "/adivinaeljugador.png", href: "/adivinaeljugador", detalle: "Adivina al jugador oculto", estilo: "adivina" },
  {titulo: "Link", imagen: "/link.png", href: "/link", detalle: "Descubrí al jugador oculto"},
  { titulo: "¿Quién tiene más?", imagen: "/grid.png", href: "/quienmas", detalle: "Compará goles, asistencias y títulos", estilo: "quienmas" },
];

// El desafío diario cambia de juego según la fecha, para que todas las personas vean la misma propuesta ese día.
function obtenerJuegoDelDia() {
  const fecha = new Date();
  const claveFecha = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;
  const semilla = [...claveFecha].reduce((total, caracter) => total + caracter.charCodeAt(0), 0);
  return juegos[semilla % juegos.length];
}

// Página protegida con el catálogo, chat global, perfil de navegación y cierre de sesión.
export default function MenuPage() {
  // Guarda la navegación, el resultado del sorteo aleatorio y el temporizador que la retrasa.
  const router = useRouter();
  const [juegoSorpresa, setJuegoSorpresa] = useState(null);
  const [sorteando, setSorteando] = useState(false);
  const [rachaDiaria, setRachaDiaria] = useState(0);
  const [juegoDelDia, setJuegoDelDia] = useState(juegos[0]);
  const temporizadorSorpresa = useRef(null);

  // Cancela la navegación diferida si la persona elige otra opción antes de que termine el sorteo.
  useEffect(() => {
    setJuegoDelDia(obtenerJuegoDelDia());
    return () => window.clearTimeout(temporizadorSorpresa.current);
  }, []);

  // Recupera del navegador la racha personal de desafíos diarios sin agregar tablas a MySQL.
  useEffect(() => {
    const datos = JSON.parse(window.localStorage.getItem("fulboDesafioDiario") || "{}");
    setRachaDiaria(Number(datos.racha || 0));
  }, []);

  // Registra el día actual una sola vez y actualiza la racha consecutiva antes de abrir el juego elegido.
  const jugarDesafioDiario = () => {
    const ahora = new Date();
    const fecha = `${ahora.getFullYear()}-${ahora.getMonth() + 1}-${ahora.getDate()}`;
    const ayerDate = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1);
    const ayer = `${ayerDate.getFullYear()}-${ayerDate.getMonth() + 1}-${ayerDate.getDate()}`;
    const datos = JSON.parse(window.localStorage.getItem("fulboDesafioDiario") || "{}");
    const racha = datos.fecha === fecha ? Number(datos.racha || 1) : datos.fecha === ayer ? Number(datos.racha || 0) + 1 : 1;
    window.localStorage.setItem("fulboDesafioDiario", JSON.stringify({ fecha, racha }));
    setRachaDiaria(racha);
    router.push(juegoDelDia.href);
  };

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

  // Borra la identidad guardada localmente y vuelve a la pantalla de autenticación.
  const cerrarSesion = () => {
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("usuarioNombre");
    window.dispatchEvent(new Event("sesionActualizada"));
    router.replace("/login");
  };

  return (
    <AuthGuard>
    <main className="menuPagina">
      <section className="menuHero" aria-labelledby="tituloMenu">
        <div>
          <h2 id="tituloMenu">Elegí un juego</h2>
          <p>Todos los desafíos de fútbol, en un solo lugar.</p>
        </div>
      </section>

      {/* LogrosPanel siempre aparece en el menú; ResultCard actualiza lo desbloqueado al terminar cada juego. */}
      <LogrosPanel />

      {/* Presenta el desafío del día: un juego destacado compartido por fecha y guardado como jugado en este navegador. */}
      <section className="desafioDiario" aria-labelledby="tituloDesafioDiario">
        <div>
          <p className="lobbyEtiqueta">Desafío del día</p>
          <h3 id="tituloDesafioDiario">Hoy toca {juegoDelDia.titulo}</h3>
          <p>{juegoDelDia.detalle}. Racha diaria: {rachaDiaria} días.</p>
        </div>
        <button className="desafioDiarioBoton" type="button" onClick={jugarDesafioDiario}>Jugar desafío</button>
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
