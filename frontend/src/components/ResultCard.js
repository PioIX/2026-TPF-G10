"use client";

import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import { LOGROS, obtenerClaveLogros } from "../utils/logros";

// Resultado compartido al terminar una partida, con acciones para volver a jugar o al menú.
export default function ResultCard({ gano, titulo, detalle, onReiniciar, className = "", juego = "partida" }) {
  const [logros, setLogros] = useState([]);
  const resultadoContado = useRef(false);

  // Esta cuenta local solo sirve para anunciar logros en la tarjeta de resultado.
  // El panel permanente del menú calcula los logros desde el historial MySQL vía GET /logros;
  // por eso el progreso local de este navegador no es la fuente de verdad del perfil.
  useEffect(() => {
    if (resultadoContado.current) return;
    resultadoContado.current = true;
    // Usa el ID de la cuenta para que los resultados no se mezclen entre perfiles.
    const idUsuario = window.localStorage.getItem("usuarioId");
    if (!idUsuario) return;
    const clave = obtenerClaveLogros(idUsuario);
    const guardado = JSON.parse(window.localStorage.getItem(clave) || "{}");
    const partidas = Number(guardado.partidas || 0) + 1;
    const victorias = Number(guardado.victorias || 0) + (gano ? 1 : 0);
    const yaDesbloqueados = Array.isArray(guardado.logros) ? guardado.logros : [];
    const juegosJugadosPrevios = Array.isArray(guardado.juegosJugados) ? guardado.juegosJugados : [];
    const juegosGanadosPrevios = Array.isArray(guardado.juegosGanados) ? guardado.juegosGanados : [];
    // Set evita contar dos veces un tipo de juego aunque se hayan jugado muchas partidas del mismo.
    const juegosJugados = [...new Set([...juegosJugadosPrevios, juego])];
    const juegosGanados = [...new Set([...juegosGanadosPrevios, ...(gano ? [juego] : [])])];
    const rachaVictorias = gano ? Number(guardado.rachaVictorias || 0) + 1 : 0;
    // Estas reglas determinan qué logros del catálogo compartido se ganan con esta partida.
    const condiciones = {
      "primera-partida": partidas >= 1,
      "primera-victoria": victorias >= 1,
      "cinco-partidas": partidas >= 5,
      "diez-partidas": partidas >= 10,
      "cinco-victorias": victorias >= 5,
      "diez-victorias": victorias >= 10,
      "tres-juegos": juegosGanados.length >= 3,
      "racha-tres": rachaVictorias >= 3,
      "racha-cinco": rachaVictorias >= 5,
      coleccionista: juegosJugados.length >= 5,
    };
    // filter deja solo los logros cuyas condiciones se cumplen y que aún no estaban guardados.
    const nuevos = LOGROS.filter((logro) => condiciones[logro.id] && !yaDesbloqueados.includes(logro.id));
    const desbloqueados = [...yaDesbloqueados, ...nuevos.map((logro) => logro.id)];
    window.localStorage.setItem(clave, JSON.stringify({ partidas, victorias, logros: desbloqueados, juegosJugados, juegosGanados, rachaVictorias }));
    setLogros(nuevos.map((logro) => logro.nombre));
  }, [gano, juego]);

  return (
    <section className={`result ${gano ? "result-ok" : "result-mal"} ${className}`.trim()} aria-live="polite">
      <h2>{titulo ?? (gano ? "¡Ganaste!" : "Perdiste")}</h2>
      {detalle && <p>{detalle}</p>}
      {/* Frase corta de relator: acompaña el resultado sin afectar el puntaje ni la partida. */}
      <p className="fraseRelator">{gano ? "¡Se festeja en las tribunas!" : "Final del partido. La revancha espera."}</p>
      {logros.length > 0 && <div className="logrosDesbloqueados" role="status"><strong>Logros desbloqueados</strong>{logros.map((logro) => <p key={logro}>{logro}</p>)}</div>}
      <div className="result-acciones">
        <Button type="button" onClick={onReiniciar}>Jugar de nuevo</Button>
        <Button href="/menu" variant="ghost">Volver al menú</Button>
      </div>
    </section>
  );
}
