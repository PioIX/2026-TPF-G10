// src/app/link/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import "../global.css";
import GameLobby, { useGameSession } from "../../components/GameLobby";
import GoalCelebration from "../../components/GoalCelebration";
import { BACKEND_URL } from "../../config/backend";
import { comentarioFutbolero } from "../../utils/comentariosFutboleros";
import SportsImage from "../../components/SportsImage";
import ResultCard from "../../components/ResultCard";
import useRegistrarResultado from "../../hooks/useRegistrarResultado";

// Dirección base de las consultas HTTP de este juego.
const API_URL = BACKEND_URL;
// Máximo de compañeros que se pueden revelar y de intentos para adivinar.
const PISTAS_TOTALES = 5;
const MAX_INTENTOS = 6; 

// Cada tarjeta resuelve su propia foto; las pistas ocultas no consultan ni revelan jugadores.
function TarjetaJugadorLink({ nombre, visible, objetivo = false }) {
  const clase = objetivo
    ? `link-jugador-objetivo ${visible ? "link-objetivo-revelado" : "link-objetivo-jugando"}`
    : `link-tarjeta-pista ${visible ? "link-pista-visible" : "link-pista-oculta"}`;
  return (
    <div className={clase}>
      {visible ? (
        <>
          <SportsImage tipo="player" nombre={nombre} alt={nombre} size={objetivo ? 96 : 64} />
          <span>{nombre}</span>
        </>
      ) : "?"}
    </div>
  );
}

// Homogeneiza nombres de personas y clubes antes de comparar respuestas.
function limpiarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toLowerCase()
    .trim();
}

// Comprueba si dos jugadores coincidieron en un mismo club durante años que se solapan.
function compartieronCanchaTemporalmente(trayectoriaA, trayectoriaB) {
  for (const tA of trayectoriaA) {
    for (const tB of trayectoriaB) {
      if (limpiarTexto(tA.club) === limpiarTexto(tB.club)) {
        const currentYear = new Date().getFullYear();
        
        const inicioA = tA.ingreso > 0 ? tA.ingreso : 1900;
        const finA = tA.traspaso > 0 ? tA.traspaso : currentYear;
        
        const inicioB = tB.ingreso > 0 ? tB.ingreso : 1900;
        const finB = tB.traspaso > 0 ? tB.traspaso : currentYear;

        if (inicioA <= finB && finA >= inicioB) {
          return true;
        }
      }
    }
  }
  return false;
}

// Envuelve el juego con el lobby común de partida individual o sala online.
export default function LinkPage() {
  return (
    <GameLobby game="link">
      <LinkGame />
    </GameLobby>
  );
}

// Ejecuta Link: prepara un objetivo, revela compañeros como pistas y valida intentos.
function LinkGame() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();

  // El estado conserva sugerencias, objetivo secreto, pistas vistas, intentos y resultado actual.
  // Mantiene los nombres disponibles para el autocompletado de respuestas.
  const [nombresSugerencias, setNombresSugerencias] = useState([]);
  
  const [jugadorObjetivo, setJugadorObjetivo] = useState(null);
  const [pistas, setPistas] = useState([]); 
  const [intentosFallidos, setIntentosFallidos] = useState(0); 
  // Pistas extra opcionales: revelan compañeros sin gastar intentos de respuesta.
  const [pistasExtra, setPistasExtra] = useState(0);
  
  const [estadoPartida, setEstadoPartida] = useState("jugando");
  const [inputAdivinar, setInputAdivinar] = useState("");
  const [mensaje, setMensaje] = useState(`Adiviná el objetivo. Tenés ${MAX_INTENTOS} intentos totales.`);

  // Registra el resultado de Link y habilita el mismo sistema de logros que los demás juegos.
  useRegistrarResultado("link", estadoPartida !== "jugando", estadoPartida === "ganado", MAX_INTENTOS - intentosFallidos);

  const prepararPartida = useCallback((datos) => {
    const jugadoresMap = new Map();
    const nombresSet = new Set();

    // Igual que en Adivina, el JOIN repite futbolistas por sus clubes; Map los agrupa por ID.
    // En cada fila se añade al jugador el club y los años que luego sirven para buscar compañeros.
    datos.forEach((fila) => {
      const id = fila.id_jugador;
      if (!id) return;

      if (!jugadoresMap.has(id)) {
        jugadoresMap.set(id, {
          id,
          nombre: `${fila.nombre || ""} ${fila.apellido || ""}`.trim(),
          trayectoria: [],
        });
      }

      const jugador = jugadoresMap.get(id);
      nombresSet.add(jugador.nombre);

      const club = fila.nombre_equipo || "";
      if (club) {
        jugador.trayectoria.push({
          club,
          ingreso: Number(fila.anio_ingreso) || 0,
          traspaso: Number(fila.anio_traspaso) || 0,
        });
      }
      
      if (fila.club_actual && limpiarTexto(fila.club_actual) !== limpiarTexto(club)) {
        jugador.trayectoria.push({
          club: fila.club_actual,
          ingreso: Number(fila.anio_ingreso) || 0, 
          traspaso: new Date().getFullYear(),
        });
      }
    });

    // Se convierten las colecciones Map/Set a arreglos porque el resto del juego usa filter/sort.
    const listaJugadores = Array.from(jugadoresMap.values());
    setNombresSugerencias(Array.from(nombresSet).sort());

    const posiblesObjetivos = [...listaJugadores].sort(() => Math.random() - 0.5);
    let objetivoElegido = null;
    let companerosElegidos = [];

    for (const candidato of posiblesObjetivos) {
      // filter produce los posibles compañeros del candidato; se excluye al candidato mismo.
      const companeros = listaJugadores.filter(otro => {
        if (otro.id === candidato.id) return false;
        return compartieronCanchaTemporalmente(candidato.trayectoria, otro.trayectoria);
      });

      if (companeros.length >= PISTAS_TOTALES) {
        objetivoElegido = candidato;
        // Orden aleatorio y slice toma solo las cinco primeras fichas para usarlas como pistas.
        companerosElegidos = companeros.sort(() => Math.random() - 0.5).slice(0, PISTAS_TOTALES);
        break;
      }
    }

    if (objetivoElegido) {
      setJugadorObjetivo(objetivoElegido);
      setPistas(companerosElegidos);
      setIntentosFallidos(0);
      setPistasExtra(0);
      setEstadoPartida("jugando");
    } else {
      setMensaje("No hay suficientes datos con fechas cruzadas en la base.");
    }
  }, []);

  const cargarJugadores = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/jugadores`);
      const datos = await respuesta.json();
      if (Array.isArray(datos) && datos.length > 0) {
        prepararPartida(datos);
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error al cargar la base de datos.");
    }
  }, [prepararPartida]);

  useEffect(() => {
    // Pospone la carga al microtask para iniciar la lectura después del primer render.
    Promise.resolve().then(cargarJugadores);
  }, [cargarJugadores]);

  const intentarAdivinar = () => {
    if (estadoPartida !== "jugando" || !jugadorObjetivo) return;

    const textoIngresado = limpiarTexto(inputAdivinar);
    
    if (!nombresSugerencias.some(n => limpiarTexto(n) === textoIngresado)) {
      setMensaje("Seleccioná un nombre válido de la lista.");
      return;
    }

    if (textoIngresado === limpiarTexto(jugadorObjetivo.nombre)) {
      setEstadoPartida("ganado");
      setMensaje(`¡Excelente! ${comentarioFutbolero("acierto")} Era ${jugadorObjetivo.nombre}.`);
      marcarPartidaTerminada();
    } else {
      const nuevosFallos = intentosFallidos + 1;
      setIntentosFallidos(nuevosFallos);
      setInputAdivinar("");

      if (nuevosFallos >= MAX_INTENTOS) {
        setEstadoPartida("perdido");
        setMensaje(`Perdiste. El jugador oculto era ${jugadorObjetivo.nombre}.`);
        marcarPartidaTerminada();
      } else if (nuevosFallos === MAX_INTENTOS - 1) {
        setMensaje(`¡Cuidado! Te queda tu última chance y ya tenés a todos revelados.`);
      } else {
        const revelados = Math.min(nuevosFallos + 1, PISTAS_TOTALES);
        setMensaje(`Incorrecto. Se reveló la pista ${revelados}/${PISTAS_TOTALES}. Te quedan ${MAX_INTENTOS - nuevosFallos} intentos.`);
      }
    }
  };

  // Adelanta una pista cuando alguien se traba, sin cambiar el contador de intentos.
  const mostrarOtraPista = () => {
    const yaVisibles = Math.min(intentosFallidos + 1 + pistasExtra, PISTAS_TOTALES);
    if (yaVisibles < PISTAS_TOTALES) setPistasExtra((prev) => prev + 1);
  };

  const cantidadPistasVisibles = Math.min(
    intentosFallidos + 1 + pistasExtra,
    PISTAS_TOTALES
  );

  useEffect(() => {
    // slice limita la lista a las pistas visibles y map la reduce a nombres públicos.
    // El servidor recibe este progreso permitido, no el jugador objetivo secreto.
    const pistasReveladas = pistas
      .slice(0, cantidadPistasVisibles)
      .map((pista) => pista.nombre);
    enviarProgreso({
      intentosUsados: intentosFallidos,
      terminado: estadoPartida !== "jugando",
      adivino: estadoPartida === "ganado",
      pistasReveladas,
    });
    if (estadoPartida !== "jugando") marcarPartidaTerminada();
  }, [intentosFallidos, cantidadPistasVisibles, estadoPartida, pistas, modo, sala?.status, enviarProgreso, marcarPartidaTerminada]);

  return (
    <>
      {estadoPartida === "ganado" && <GoalCelebration />}
      <main id="main">
        <h2 className="link-titulo">FUTBOL11 LINK</h2>
        
        <div className="link-arbol-contenedor">
          
          {/* Jugador Objetivo */}
          <TarjetaJugadorLink
            nombre={jugadorObjetivo?.nombre || ""}
            visible={estadoPartida !== "jugando"}
            objetivo
          />

          {/* Llaves conectoras */}
          <div className="link-linea-horizontal"></div>
          <div className="link-linea-vertical"></div>

          {/* Compañeros */}
          <div className="link-contenedor-pistas">
            {pistas.map((pista, index) => {
              const visible = estadoPartida !== "jugando" || index < cantidadPistasVisibles;

              return (
                <div key={index} className={`link-pista-wrapper ${visible ? "link-pista-revelada" : ""}`}>
                  <TarjetaJugadorLink nombre={pista.nombre} visible={visible} />
                </div>
              );
            })}
          </div>
        </div>

        <div id="caja-preguntas" className="link-caja-preguntas">
          <p id="mensaje-juego" className="mensaje-juego link-mensaje-juego">
            {mensaje}
          </p>

          <div id="caja-adivinar" className="link-caja-adivinar">
            <input
              type="text"
              id="input-adivinar"
              className="input-pill"
              list="sugerencias-nombres"
              placeholder="¿Quién es el objetivo?"
              value={inputAdivinar}
              onChange={(e) => setInputAdivinar(e.target.value)}
              disabled={estadoPartida !== "jugando"}
            />
            <datalist id="sugerencias-nombres">
              {nombresSugerencias.map((nombre, idx) => (
                <option key={idx} value={nombre} />
              ))}
            </datalist>
            <button
              id="btn-adivinar"
              type="button"
              className="btn-accion"
              onClick={intentarAdivinar}
              disabled={estadoPartida !== "jugando" || !inputAdivinar.trim()}
            >
              Adivinar
            </button>
          </div>
          {estadoPartida === "jugando" && cantidadPistasVisibles < PISTAS_TOTALES && (
            <button className="botonAyudaJuego comodinJuego" type="button" onClick={mostrarOtraPista}>
              Comodín · revelar conexión ({PISTAS_TOTALES - cantidadPistasVisibles} restantes)
            </button>
          )}
          {estadoPartida !== "jugando" && (
            <ResultCard
              juego="link"
              gano={estadoPartida === "ganado"}
              titulo={estadoPartida === "ganado" ? "¡Objetivo encontrado!" : "Se terminaron los intentos"}
              detalle={mensaje}
              onReiniciar={cargarJugadores}
              className="resultadoPartida"
            />
          )}
        </div>
      </main>
    </>
  );
}
