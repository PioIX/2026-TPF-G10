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
  // El primer endpoint puede repetir jugadores por trayectoria. El Map indexa una sola ficha por ID.
  filasJugadores.forEach((fila) => {
    const id = Number(fila.id_jugador);
    if (Number.isFinite(id) && !nombres.has(id)) {
      nombres.set(id, {
        nombre: `${fila.nombre || ""} ${fila.apellido || ""}`.trim(),
        club: fila.club_actual || "",
      });
    }
  });

  // map recorre estadísticas y agrega nombre/ID desde el Map; filter descarta filas sin jugador.
  return filasEstadisticas.flatMap((fila) => {
    const id = Number(fila.id_jugador);
    const jugador = nombres.get(id);
    return jugador && Number.isFinite(id) ? [{ ...fila, id, ...jugador }] : [];
  });
}

// Prepara hasta cinco duelos, buscando pares distintos por categoría para no depender de reintentos al azar.
function crearDuelos(jugadores) {
  const duelos = [];
  const categoriasMezcladas = [...CATEGORIAS].sort(() => Math.random() - 0.5);

  categoriasMezcladas.forEach((categoria) => {
    if (duelos.length >= 5) return;
    const grupos = new Map();
    jugadores.forEach((jugador) => {
      const valorOriginal = jugador[categoria.campo];
      if (valorOriginal == null || valorOriginal === "") return;
      const valor = Number(valorOriginal);
      if (!Number.isFinite(valor)) return;
      if (!grupos.has(valor)) grupos.set(valor, []);
      grupos.get(valor).push(jugador);
    });

    const valoresDistintos = [...grupos.keys()];
    if (valoresDistintos.length < 2) return;
    const valoresMezclados = valoresDistintos.sort(() => Math.random() - 0.5);
    const valorPrimero = valoresMezclados[0];
    const valorSegundo = valoresMezclados.find((valor) => valor !== valorPrimero);
    const primero = grupos.get(valorPrimero)[Math.floor(Math.random() * grupos.get(valorPrimero).length)];
    const segundo = grupos.get(valorSegundo)[Math.floor(Math.random() * grupos.get(valorSegundo).length)];
    duelos.push({ categoria, primero, segundo, valorPrimero, valorSegundo });
  });

  // Si alguna categoría no ofrece dos valores distintos, se repiten las categorías que sí pueden jugarse.
  while (duelos.length > 0 && duelos.length < 5) {
    const anterior = duelos[Math.floor(Math.random() * duelos.length)];
    const grupoMayor = jugadores.filter((jugador) => Number(jugador[anterior.categoria.campo]) === anterior.valorPrimero);
    const grupoMenor = jugadores.filter((jugador) => Number(jugador[anterior.categoria.campo]) === anterior.valorSegundo);
    const primero = grupoMayor[Math.floor(Math.random() * grupoMayor.length)];
    const segundo = grupoMenor[Math.floor(Math.random() * grupoMenor.length)];
    duelos.push({ ...anterior, primero, segundo });
  }
  return duelos;
}

// El juego corre dentro de GameLobby; este componente solo maneja preguntas, puntaje y resultado.
function QuienMasGame() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();
  const [duelos, setDuelos] = useState([]);
  const [ronda, setRonda] = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [mensajeRespuesta, setMensajeRespuesta] = useState("");
  const [terminado, setTerminado] = useState(false);
  const [gano, setGano] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Descarga jugadores y estadísticas; los dos pedidos se unen por id_jugador.
  const cargarDuelos = useCallback(async () => {
    try {
      setError("");
      setCargando(true);
      const [respuestaJugadores, respuestaEstadisticas] = await Promise.all([
        fetch(`${BACKEND_URL}/jugadores`),
        fetch(`${BACKEND_URL}/estadisticas`),
      ]);
      if (!respuestaJugadores.ok || !respuestaEstadisticas.ok) throw new Error("No se pudieron cargar los datos del juego.");
      const [filasJugadores, filasEstadisticas] = await Promise.all([
        respuestaJugadores.json(),
        respuestaEstadisticas.json(),
      ]);
      if (!Array.isArray(filasJugadores) || !Array.isArray(filasEstadisticas)) {
        throw new Error("El servidor devolvió los datos del juego en un formato inesperado.");
      }
      const duelosPreparados = crearDuelos(unirJugadoresConEstadisticas(filasJugadores, filasEstadisticas));
      if (!duelosPreparados.length) throw new Error("No hay dos jugadores con valores distintos en las estadísticas. Revisá que la base tenga datos cargados.");
      setDuelos(duelosPreparados);
      setRonda(0);
      setPuntaje(0);
      setHistorial([]);
      setMensajeRespuesta("");
      setTerminado(false);
      setGano(false);
    } catch (errorCarga) {
      setDuelos([]);
      setError(errorCarga instanceof Error ? errorCarga.message : "No se pudo iniciar ¿Quién tiene más?.");
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga una partida al entrar; el mismo botón vuelve a llamar esta función al reiniciar.
  // La carga async sincroniza datos remotos cuando se monta el juego.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarDuelos(); }, [cargarDuelos]);

  // Guarda el resultado en las partidas del usuario al terminar las cinco preguntas.
  useRegistrarResultado("quienmas", terminado, gano, puntaje);

  // Publica al rival solo la cantidad contestada y el puntaje, sin enviar la respuesta correcta.
  useEffect(() => {
    if (modo !== "online" || sala?.status !== "jugando") return;
    enviarProgreso({ comparaciones: ronda, puntaje, historial, terminado, gano: terminado && gano });
    if (terminado) marcarPartidaTerminada();
  }, [modo, sala?.status, ronda, puntaje, historial, terminado, gano, enviarProgreso, marcarPartidaTerminada]);

  // Comprueba cuál de los dos números es mayor y pasa a la siguiente pregunta.
  const responder = (jugadorElegido) => {
    const duelo = duelos[ronda];
    if (!duelo || terminado) return;
    const respuestaCorrecta = duelo.valorPrimero > duelo.valorSegundo ? duelo.primero.id : duelo.segundo.id;
    const jugadorCorrecto = duelo.valorPrimero > duelo.valorSegundo ? duelo.primero : duelo.segundo;
    const valorCorrecto = Math.max(duelo.valorPrimero, duelo.valorSegundo);
    const valorOtro = Math.min(duelo.valorPrimero, duelo.valorSegundo);
    //operador ternario, el ? es si es verdadero y el : es si es falso, se asigna un mensaje distinto según si acertó o no
    setMensajeRespuesta(jugadorElegido === respuestaCorrecta
      ? `Pregunta anterior: ¡correcto! ${jugadorCorrecto.nombre} tiene más ${duelo.categoria.nombre} (${valorCorrecto} contra ${valorOtro}).`
      : `Pregunta anterior: no era esa. ${jugadorCorrecto.nombre} tiene más ${duelo.categoria.nombre} (${valorCorrecto} contra ${valorOtro}).`);
    // El puntaje solo suma uno si el ID elegido coincide con el ID de mayor estadística.
    const nuevoPuntaje = puntaje + (jugadorElegido === respuestaCorrecta ? 1 : 0);
    setHistorial((actual) => [...actual, {
      categoria: duelo.categoria.nombre,
      correcto: jugadorElegido === respuestaCorrecta,
      ganador: jugadorCorrecto.nombre,
      elegido: duelo.primero.id === jugadorElegido ? duelo.primero.nombre : duelo.segundo.nombre,
      primero: duelo.primero.nombre,
      valorPrimero: duelo.valorPrimero,
      segundo: duelo.segundo.nombre,
      valorSegundo: duelo.valorSegundo,
    }]);
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
            <span key={puntaje}>{puntaje} aciertos</span>
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
