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
  { titulo: "Fulbo 11", imagen: "/fulbo11.png", href: "/fulbo11", detalle: "Armá tu equipo titular", estilo: "fulbo" },
  { titulo: "Wordle", imagen: "/wordle.png", href: "/wordle", detalle: "Descifrá el jugador", estilo: "wordle" },
  { titulo: "Grid", imagen: "/grid.png", href: "/grid", detalle: "Completá cada cruce", estilo: "grid" },
  { titulo: "Adivina el jugador", imagen: "/adivinaeljugador.png", href: "/adivinaeljugador", detalle: "¿Quién está detrás de la pista?", estilo: "adivina" },
  { titulo: "Link", imagen: "/link.png", href: "/link", detalle: "Conectá las pistas", estilo: "link" },
  { titulo: "¿Quién tiene más?", imagen: "/quientienemas.png", href: "/quienmas", detalle: "Compará números y títulos", estilo: "quienmas" },
];

// El desafío diario cambia de juego según la fecha, para que todas las personas vean la misma propuesta ese día.
function obtenerJuegoDelDia() {
  const fecha = new Date();
  const claveFecha = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;
  const semilla = [...claveFecha].reduce((total, caracter) => total + caracter.charCodeAt(0), 0);
  return juegos[semilla % juegos.length];
}

function fechaLocal() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${ahora.getMonth() + 1}-${ahora.getDate()}`;
}

// Página protegida con el catálogo, chat global, perfil de navegación y cierre de sesión.
export default function MenuPage() {
  // Guarda la navegación, el resultado del sorteo aleatorio y el temporizador que la retrasa.
  const router = useRouter();
  const [juegoSorpresa, setJuegoSorpresa] = useState(null);
  const [sorteando, setSorteando] = useState(false);
  const [rachaDiaria, setRachaDiaria] = useState(0);
  const [desafioCompletado, setDesafioCompletado] = useState(false);
  const [juegoDelDia] = useState(obtenerJuegoDelDia);
  const temporizadorSorpresa = useRef(null);

  // Cancela la navegación diferida si la persona elige otra opción antes de que termine el sorteo.
  useEffect(() => {
    return () => window.clearTimeout(temporizadorSorpresa.current);
  }, []);

  // Recupera del navegador la racha personal de desafíos diarios sin agregar tablas a MySQL.
  useEffect(() => {
    const datos = JSON.parse(window.localStorage.getItem("fulboDesafioDiario") || "{}");
    // LocalStorage solo existe tras montar: cargarlo acá evita diferencias de hidratación SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRachaDiaria(Number(datos.racha || 0));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDesafioCompletado(datos.fecha === fechaLocal() && datos.completado === true && datos.juego === juegoDelDia.href);
    const actualizarDesafio = () => {
      const actual = JSON.parse(window.localStorage.getItem("fulboDesafioDiario") || "{}");
      setDesafioCompletado(actual.fecha === fechaLocal() && actual.completado === true && actual.juego === juegoDelDia.href);
    };
    window.addEventListener("desafioDiarioActualizado", actualizarDesafio);
    return () => window.removeEventListener("desafioDiarioActualizado", actualizarDesafio);
  }, [juegoDelDia.href]);

  // Registra el día actual una sola vez y actualiza la racha consecutiva antes de abrir el juego elegido.
  const jugarDesafioDiario = () => {
    const ahora = new Date();
    const fecha = fechaLocal();
    const ayerDate = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1);
    const ayer = `${ayerDate.getFullYear()}-${ayerDate.getMonth() + 1}-${ayerDate.getDate()}`;
    const datos = JSON.parse(window.localStorage.getItem("fulboDesafioDiario") || "{}");
    const racha = datos.fecha === fecha ? Number(datos.racha || 1) : datos.fecha === ayer ? Number(datos.racha || 0) + 1 : 1;
    window.localStorage.setItem("fulboDesafioDiario", JSON.stringify({ fecha, racha, juego: juegoDelDia.href, completado: datos.completado === true && datos.fecha === fecha && datos.juego === juegoDelDia.href }));
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
          <span className="menuHeroEtiqueta">FULBO 11 <i/></span>
          <h2 id="tituloMenu">El partido<br />empieza acá.</h2>
          <p>Elegí tu desafío, armá la estrategia y salí a jugar.</p>
        </div>
      </section>

      {/* LogrosPanel consulta al backend; este vuelve a calcular el progreso desde el historial de partidas en MySQL. */}
      <LogrosPanel />

      {/* Presenta el desafío del día: un juego destacado compartido por fecha y guardado como jugado en este navegador. */}
      <div className="menuDestacados">
      <section className="desafioDiario" aria-labelledby="tituloDesafioDiario">
        <div>
          <p className="lobbyEtiqueta">Desafío del día</p>
          <h3 id="tituloDesafioDiario">Hoy toca {juegoDelDia.titulo}</h3>
          <p>{juegoDelDia.detalle}. Racha diaria: {rachaDiaria} días.</p>
        </div>
        <div className="desafioDiarioAcciones">
          {desafioCompletado && <span className="desafioCompletado"><span aria-hidden="true">✓</span> Completado hoy</span>}
          <button className="desafioDiarioBoton" type="button" onClick={jugarDesafioDiario}>{desafioCompletado ? "Volver a jugar" : "Jugar desafío"}</button>
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
      </div>

      <div className="menuConChat">
        <div className="menuJuegosColumna">
          <div className="menuJuegosCabecera">
            <div><span>ENCUENTROS DISPONIBLES</span><h3>Elegí tu próximo desafío</h3></div>
            <span className="menuJuegosCantidad">{String(juegos.length).padStart(2, "0")} MODOS</span>
          </div>
          <section className="juegos" aria-label="Juegos disponibles">
            {juegos.map((juego) => (
              <GameCard key={juego.href} {...juego} sorteada={juegoSorpresa?.href === juego.href} />
            ))}
          </section>
        </div>

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
