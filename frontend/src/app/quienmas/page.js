"use client";

import { useCallback, useEffect, useState } from "react";
import GameLobby, { useGameSession } from "../../components/GameLobby";
import ResultCard from "../../components/ResultCard";
import SportsImage from "../../components/SportsImage";
import { BACKEND_URL } from "../../config/backend";
import useRegistrarResultado from "../../hooks/useRegistrarResultado";

// Cada pregunta elige una de estas estadísticas, todas disponibles en la tabla Estadisticas.
const CATEGORIAS = [
  { campo: "goles", nombre: "goles" },
  { campo: "asistencias", nombre: "asistencias" },
  { campo: "titulos_equipo", nombre: "títulos de club" },
  { campo: "titulos_seleccion", nombre: "títulos de selección" },
  { campo: "titulos_individuales", nombre: "premios individuales" },
];

// Junta nombre y estadísticas usando el ID del jugador como vínculo entre las tablas.
function unirJugadoresConEstadisticas(filasJugadores, filasEstadisticas) {
  const nombres = new Map();
  filasJugadores.forEach((fila) => {
    if (fila.id_jugador && !nombres.has(Number(fila.id_jugador))) {
      nombres.set(Number(fila.id_jugador), {
        nombre: `${fila.nombre || ""} ${fila.apellido || ""}`.trim(),
        club: fila.club_actual || "",
      });
    }
  });

  return filasEstadisticas
    .map((fila) => ({ ...fila, id: Number(fila.id_jugador), ...nombres.get(Number(fila.id_jugador)) }))
    .filter((jugador) => jugador.nombre);
}

// Prepara cinco duelos sencillos y evita comparar jugadores que tengan el mismo número.
function crearDuelos(jugadores) {
  const duelos = [];
  for (let ronda = 0; ronda < 5; ronda += 1) {
    let duelo = null;
    for (let intento = 0; intento < 80 && !duelo; intento += 1) {
      const categoria = CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)];
      const primero = jugadores[Math.floor(Math.random() * jugadores.length)];
      const segundo = jugadores[Math.floor(Math.random() * jugadores.length)];
      const valorPrimero = Number(primero?.[categoria.campo]);
      const valorSegundo = Number(segundo?.[categoria.campo]);
      if (primero?.[categoria.campo] != null && segundo?.[categoria.campo] != null && primero.id !== segundo.id && Number.isFinite(valorPrimero) && Number.isFinite(valorSegundo) && valorPrimero !== valorSegundo) {
        duelo = { categoria, primero, segundo, valorPrimero, valorSegundo };
      }
    }
    if (duelo) duelos.push(duelo);
  }
  return duelos;
}

// El juego corre dentro de GameLobby; este componente solo maneja preguntas, puntaje y resultado.
function QuienMasGame() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();
  const [duelos, setDuelos] = useState([]);
  const [ronda, setRonda] = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [mensajeRespuesta, setMensajeRespuesta] = useState("");
  const [terminado, setTerminado] = useState(false);
  const [gano, setGano] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Descarga jugadores y estadísticas; los dos pedidos se unen por id_jugador.
  const cargarDuelos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [respuestaJugadores, respuestaEstadisticas] = await Promise.all([
        fetch(`${BACKEND_URL}/jugadores`),
        fetch(`${BACKEND_URL}/estadisticas`),
      ]);
      if (!respuestaJugadores.ok || !respuestaEstadisticas.ok) throw new Error("No se pudieron cargar los datos del juego.");
      const [filasJugadores, filasEstadisticas] = await Promise.all([
        respuestaJugadores.json(),
        respuestaEstadisticas.json(),
      ]);
      const duelosPreparados = crearDuelos(unirJugadoresConEstadisticas(filasJugadores, filasEstadisticas));
      if (!duelosPreparados.length) throw new Error("Todavía no hay estadísticas suficientes para comparar.");
      setDuelos(duelosPreparados);
      setRonda(0);
      setPuntaje(0);
      setMensajeRespuesta("");
      setTerminado(false);
      setGano(false);
    } catch (errorCarga) {
      setError(errorCarga.message);
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga una partida al entrar; el mismo botón vuelve a llamar esta función al reiniciar.
  useEffect(() => { cargarDuelos(); }, [cargarDuelos]);

  // Guarda el resultado en las partidas del usuario al terminar las cinco preguntas.
  useRegistrarResultado("quienmas", terminado, gano, puntaje);

  // Publica al rival solo la cantidad contestada y el puntaje, sin enviar la respuesta correcta.
  useEffect(() => {
    if (modo !== "online" || sala?.status !== "jugando") return;
    enviarProgreso({ comparaciones: ronda, puntaje, terminado, gano: terminado && gano });
    if (terminado) marcarPartidaTerminada();
  }, [modo, sala?.status, ronda, puntaje, terminado, gano, enviarProgreso, marcarPartidaTerminada]);

  // Comprueba cuál de los dos números es mayor y pasa a la siguiente pregunta.
  const responder = (jugadorElegido) => {
    const duelo = duelos[ronda];
    if (!duelo || terminado) return;
    const respuestaCorrecta = duelo.valorPrimero > duelo.valorSegundo ? duelo.primero.id : duelo.segundo.id;
    const jugadorCorrecto = duelo.valorPrimero > duelo.valorSegundo ? duelo.primero : duelo.segundo;
    const valorCorrecto = Math.max(duelo.valorPrimero, duelo.valorSegundo);
    const valorOtro = Math.min(duelo.valorPrimero, duelo.valorSegundo);
    setMensajeRespuesta(jugadorElegido === respuestaCorrecta
      ? `Pregunta anterior: ¡correcto! ${jugadorCorrecto.nombre} tiene más ${duelo.categoria.nombre} (${valorCorrecto} contra ${valorOtro}).`
      : `Pregunta anterior: no era esa. ${jugadorCorrecto.nombre} tiene más ${duelo.categoria.nombre} (${valorCorrecto} contra ${valorOtro}).`);
    const nuevoPuntaje = puntaje + (jugadorElegido === respuestaCorrecta ? 1 : 0);
    const nuevaRonda = ronda + 1;
    setPuntaje(nuevoPuntaje);
    setRonda(nuevaRonda);
    if (nuevaRonda >= duelos.length) {
      const ganoLaPartida = nuevoPuntaje >= Math.ceil(duelos.length / 2);
      setGano(ganoLaPartida);
      setTerminado(true);
    }
  };

  const dueloActual = duelos[ronda];
  return (
    <main className="quienMasPagina">
      <h2>¿Quién tiene más?</h2>
      <p className="quienMasIntro">Compará goles, asistencias y títulos. Elegí al jugador con el número más alto.</p>
      {/* Este aviso aparece mientras se descargan los jugadores y sus estadísticas. */}
      {cargando && <p role="status">Cargando jugadores y estadísticas...</p>}
      {error && <p role="alert">{error}</p>}
      {!cargando && !error && !terminado && dueloActual && (
        <>
          <div className="quienMasMarcador">
            <span>Pregunta {ronda + 1} de {duelos.length}</span>
            <span>{puntaje} aciertos</span>
          </div>
          <p className="quienMasCategoria">¿Quién tiene más {dueloActual.categoria.nombre}?</p>
          {mensajeRespuesta && <p className="quienMasMensaje" role="status">{mensajeRespuesta}</p>}
          <div className="quienMasDuelo">
            {[dueloActual.primero, dueloActual.segundo].map((jugador) => (
              <button className="quienMasJugador" key={jugador.id} type="button" onClick={() => responder(jugador.id)}>
                {/* SportsImage busca la foto del jugador y muestra un balón si no encuentra una. */}
                <SportsImage tipo="player" nombre={jugador.nombre} alt={jugador.nombre} size={112} className="quienMasRetrato" />
                <strong>{jugador.nombre}</strong>
                <span className="quienMasClub">{jugador.club || "Jugador de fútbol"}</span>
                <span className="quienMasElegir">Elegir jugador</span>
              </button>
            ))}
          </div>
        </>
      )}
      {/* El resumen reutilizable aparece solo después de contestar la última comparación. */}
      {terminado && (
        <ResultCard
          juego="quienmas"
          gano={gano}
          titulo={gano ? "¡Buen ojo!" : "¡A seguir practicando!"}
          detalle={`Aciertos: ${puntaje} de ${duelos.length}. ${mensajeRespuesta}`}
          onReiniciar={cargarDuelos}
        />
      )}
    </main>
  );
}

// GameLobby aporta selector solo/online y muestra el progreso del rival alrededor del minijuego.
export default function QuienMasPage() {
  return <GameLobby game="quienmas"><QuienMasGame /></GameLobby>;
}
