// src/app/fulbo11/page.js
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import "../global.css";
import GameLobby, { useGameSession } from "../../components/GameLobby";
import { BACKEND_URL } from "../../config/backend";

// URL del servidor Express que entrega la lista de jugadores.
const URL_API = BACKEND_URL;

/*
 * Reglas de Fútbol 11:
 * - Se arma una formación de once posiciones, cada una asociada a un rol numérico.
 * - En cada ronda se sortea un país que todavía tenga un jugador válido para un hueco.
 * - El autocompletado ayuda a encontrar nombres, pero la función de colocación valida país,
 *   posición y que el mismo jugador no se use dos veces.
 * - En online cada persona completa su propia formación; solo publica el avance visible.
 */

// Define los roles del esquema 1–11 y el sector visual de cada hueco.
// Estos códigos describen posiciones futbolísticas; no son el dorsal de la camiseta.
const POSICIONES = [
  { numero: 7, nombre: "EI", grupo: "delanteros" },
  { numero: 9, nombre: "DC", grupo: "delanteros" },
  { numero: 11, nombre: "ED", grupo: "delanteros" },

  { numero: 8, nombre: "MC", grupo: "mediocampistas" },
  { numero: 10, nombre: "MCO", grupo: "mediocampistas" },
  { numero: 6, nombre: "MCD/MC", grupo: "mediocampistas" },

  { numero: 3, nombre: "LI", grupo: "defensas" },
  { numero: 5, nombre: "DFC", grupo: "defensas" },
  { numero: 4, nombre: "DFC", grupo: "defensas" },
  { numero: 2, nombre: "LD", grupo: "defensas" },

  { numero: 1, nombre: "ARQ", grupo: "arquero" },
];

// Quita tildes y signos y pone el texto en mayúsculas para comparar nombres escritos por la persona.
function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

// Lee los códigos de rol de una posición, por ejemplo "10-7" se transforma en ["10", "7"].
function obtenerCodigosPosicion(posicion) {
  return String(posicion || "").match(/\d+/g) || [];
}

// Comprueba si un jugador puede ocupar un puesto según los roles numéricos de la base.
function puedeJugarEnPosicion(jugador, posicion) {
  return obtenerCodigosPosicion(jugador.posicion).includes(String(posicion.numero));
}

// Elige países con al menos un jugador aún libre para alguno de los puestos que siguen vacíos.
function obtenerPaisesDisponibles(listaJugadores, equipoActual) {
  const idsUsados = new Set(
    equipoActual.filter(Boolean).map((jugador) => jugador.id)
  );
  const posicionesVacantes = POSICIONES.filter(
    (_, indice) => !equipoActual[indice]
  );
  if (posicionesVacantes.length === 0) return [];

  const jugadoresPorPais = new Map();
  listaJugadores.forEach((jugador) => {
    const clavePais = normalizarTexto(jugador.pais);
    if (!clavePais) return;
    if (!jugadoresPorPais.has(clavePais)) jugadoresPorPais.set(clavePais, []);
    jugadoresPorPais.get(clavePais).push(jugador);
  });

  return Array.from(jugadoresPorPais.values())
    .filter((plantel) =>
      plantel.some(
        (jugador) =>
          !idsUsados.has(jugador.id) &&
          posicionesVacantes.some((posicion) =>
            puedeJugarEnPosicion(jugador, posicion)
          )
      )
    )
    .map((plantel) => plantel[0].pais);
}

// Sortea una nación entre las que pueden aportar a alguna posición pendiente.
function obtenerPaisAleatorio(paisesDisponibles) {
  if (paisesDisponibles.length === 0) return "";
  return paisesDisponibles[Math.floor(Math.random() * paisesDisponibles.length)];
}

// Uso: contenido del lobby para Fútbol 11. Cada persona arma su formación en su propio estado.
function Fulbo11Game() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();

  // Guarda el plantel, el país activo, la posición seleccionada y los mensajes.
  const [jugadores, setJugadores] = useState([]);
  const [equipo, setEquipo] = useState(Array(POSICIONES.length).fill(null));
  const [posicionSeleccionada, setPosicionSeleccionada] = useState(null);
  const [paisActual, setPaisActual] = useState("");
  const [ronda, setRonda] = useState(0);
  const [entradaJugador, setEntradaJugador] = useState("");
  const [mensaje, setMensaje] = useState(
    "Seleccioná una posición vacía y escribí el nombre del jugador."
  );

  // Reinicia la formación y sortea un país cuando llega la lista del servidor o se pulsa Reiniciar.
  // useCallback conserva la misma función entre renders; es un hook de optimización no tratado en el apunte.
  const iniciarJuego = useCallback((listaJugadores) => {
    const formacionVacia = Array(POSICIONES.length).fill(null);
    const paisesDisponibles = obtenerPaisesDisponibles(
      listaJugadores,
      formacionVacia
    );
    setEquipo(formacionVacia);
    setPosicionSeleccionada(null);
    setRonda(1);
    setPaisActual(obtenerPaisAleatorio(paisesDisponibles));
    setEntradaJugador("");
    setMensaje(
      paisesDisponibles.length > 0
        ? "Seleccioná una posición vacía y escribí el nombre del jugador."
        : "No hay países con jugadores para las posiciones disponibles."
    );
  }, []);

  // Pide los jugadores al backend, agrupa duplicados de la trayectoria por id y comienza la partida.
  const cargarJugadores = useCallback(async () => {
    try {
      const respuesta = await fetch(`${URL_API}/jugadores`);
      const datos = await respuesta.json();

      if (Array.isArray(datos) && datos.length > 0) {
        // Usamos un Map por id_jugador para no duplicar jugadores con varios clubes en su trayectoria
        const mapaUnicos = new Map();
        datos.forEach((jugador) => {
          if (
            jugador &&
            jugador.id_jugador != null &&
            !mapaUnicos.has(jugador.id_jugador)
          ) {
            mapaUnicos.set(jugador.id_jugador, {
              id: jugador.id_jugador,
              nombre: `${jugador.nombre || ""} ${jugador.apellido || ""}`.trim() || "Jugador",
              pais: jugador.pais || jugador.country,
              posicion: jugador.posicion || "undefined",
            });
          }
        });

        const listaLimpia = Array.from(mapaUnicos.values());
        setJugadores(listaLimpia);
        iniciarJuego(listaLimpia);
      } else {
        setJugadores([]);
        setMensaje("No hay jugadores disponibles.");
      }
    } catch (error) {
      console.error(error);
      setJugadores([]);
      setMensaje("No se pudieron cargar los jugadores.");
    }
  }, [iniciarJuego]);

  // Efecto de montaje: inicia la carga en cliente y evita ejecutar la petición durante el render SSR.
  useEffect(() => {
    Promise.resolve().then(cargarJugadores);
  }, [cargarJugadores]);

  // Prepara la próxima colocación: cambia país y limpia la selección y el campo de texto.
  const siguienteRonda = (formacionActual) => {
    const paisesDisponibles = obtenerPaisesDisponibles(
      jugadores,
      formacionActual
    );
    setRonda((prev) => prev + 1);
    setPaisActual(obtenerPaisAleatorio(paisesDisponibles));
    setPosicionSeleccionada(null);
    setEntradaJugador("");
    if (paisesDisponibles.length === 0) {
      setMensaje("No quedan jugadores para las posiciones que siguen vacías.");
    }
  };

  // Valida nombre, país, posición y que el jugador no esté repetido antes de actualizar la formación.
  const seleccionarPosicion = (indice) => {
    const posicion = POSICIONES[indice];

    // 1. Evita pisar posiciones ocupadas
    if (equipo[indice]) {
      setMensaje(`${posicion.nombre} ya está ocupado.`);
      return;
    }

    const texto = entradaJugador.trim();

    // 2. Si el usuario no escribió nada en el input
    if (!texto) {
      setPosicionSeleccionada(indice);
      setMensaje(`Escribí primero el nombre del jugador para colocarlo en ${posicion.nombre}.`);
      return;
    }

    // 3. Busca coincidencias exactas por nombre. La lista sugerida no autoriza una respuesta por sí sola.
    const coincidencias = jugadores.filter(
      (j) => normalizarTexto(j.nombre) === normalizarTexto(texto)
    );

    if (coincidencias.length === 0) {
      setMensaje("No encontré ese jugador.");
      return;
    }

    // Si hay homónimos, priorizamos el que coincida con el país actual
    const clavePaisActual = normalizarTexto(paisActual);
    const jugador =
      coincidencias.find(
        (j) => normalizarTexto(j.pais) === clavePaisActual
      ) || coincidencias[0];

    // 4. Verifica que pertenezca al país de la ronda actual
    if (normalizarTexto(jugador.pais) !== clavePaisActual) {
      setMensaje("Ese jugador no pertenece al país mostrado.");
      return;
    }

    // 5. Verifica si el jugador puede jugar en esa posición (ej: "10-7" -> ['10', '7'])
    const posicionesPermitidas = obtenerCodigosPosicion(jugador.posicion);
    if (!posicionesPermitidas.includes(String(posicion.numero))) {
      setMensaje(`${jugador.nombre} no puede jugar de ${posicion.nombre}.`);
      return;
    }

    // 6. Evita poner al mismo jugador dos veces en la cancha
    if (equipo.some((asignado) => asignado && asignado.id === jugador.id)) {
      setMensaje(`${jugador.nombre} ya está en la formación.`);
      return;
    }

    // Si pasa todas las validaciones, se reemplaza una sola celda de la formación.
    const nuevoEquipo = [...equipo];
    nuevoEquipo[indice] = jugador;
    setEquipo(nuevoEquipo);

    const ocupadas = nuevoEquipo.filter(Boolean).length;

    if (ocupadas === POSICIONES.length) {
      setEntradaJugador("");
      setMensaje("¡Formación completa!");
      return;
    }

    setMensaje(`${jugador.nombre} fue colocado con éxito en ${posicion.nombre}.`);
    siguienteRonda(nuevoEquipo);
  };

  // Valores derivados de equipo; no se guardan aparte porque se pueden calcular en cada render.
  const cantidadColocados = equipo.filter(Boolean).length;
  const progreso = Math.round((cantidadColocados / POSICIONES.length) * 100);
  const terminoLaPartida = cantidadColocados === POSICIONES.length;

  // Este efecto corre cuando cambia el equipo o el país. En modo solo no emite nada;
  // en online envía únicamente el tablero visible y el país de la ronda al servidor.
  useEffect(() => {
    enviarProgreso({
      jugadoresColocados: cantidadColocados,
      terminado: terminoLaPartida,
      formacion: equipo.map((jugador) => (jugador ? jugador.nombre : "")),
      paisActual,
    });
    if (terminoLaPartida) marcarPartidaTerminada();
  }, [
    cantidadColocados,
    equipo,
    paisActual,
    terminoLaPartida,
    modo,
    sala?.status,
    enviarProgreso,
    marcarPartidaTerminada,
  ]);

  // Sugiere todos los nombres cargados desde la base; país, puesto y repetidos se validan al probar.
  const sugerenciasJugadores = useMemo(() => {
    const nombres = new Map();
    jugadores.forEach((jugador) => {
      const nombre = String(jugador.nombre || "").trim();
      const clave = normalizarTexto(nombre);
      if (clave && !nombres.has(clave)) nombres.set(clave, nombre);
    });
    return Array.from(nombres.values()).sort((a, b) => a.localeCompare(b, "es"));
  }, [jugadores]);

  // Genera los botones de un sector de la cancha y conecta cada uno con su índice de posición.
  const renderFilaGrupo = (nombreGrupo) => {
    return POSICIONES.map((posicion, indice) => {
      if (posicion.grupo !== nombreGrupo) return null;

      const asignado = equipo[indice];
      const estaSeleccionado = posicionSeleccionada === indice;
      const yaUsados = new Set(
        equipo.filter(Boolean).map((jugador) => jugador.id)
      );
      const hayJugadorParaEsePuesto = jugadores.some(
        (jugador) =>
          normalizarTexto(jugador.pais) === normalizarTexto(paisActual) &&
          !yaUsados.has(jugador.id) &&
          puedeJugarEnPosicion(jugador, posicion)
      );
      const estaBloqueado = Boolean(asignado) || !hayJugadorParaEsePuesto;

      return (
        <button
          key={posicion.numero}
          type="button"
          className={`casillero ${estaSeleccionado ? "casilleroSeleccionado" : ""} ${
            asignado ? "casilleroOcupado ocupado" : ""
          } ${!asignado && !hayJugadorParaEsePuesto ? "casilleroBloqueado" : ""}`}
          disabled={estaBloqueado}
          title={
            !asignado && !hayJugadorParaEsePuesto
              ? `No hay jugadores disponibles de ${paisActual} para ${posicion.nombre}.`
              : undefined
          }
          onClick={() => seleccionarPosicion(indice)}
        >
          <strong>
            {posicion.numero} - {posicion.nombre}
          </strong>
          <span>{asignado ? asignado.nombre : "Vacío"}</span>
        </button>
      );
    });
  };

  return (
    <>
      <div className="panelJuego">
        <p id="instruccionJuego">
          Elegí un jugador del país mostrado y colocalo en un espacio libre de la
          formación.
        </p>

        <div className="estadoJuego">
          <div>
            <strong>País:</strong> <span id="paisActual">{paisActual}</span>
          </div>
          <div>
            <strong>Ronda:</strong> <span id="rondaActual">{ronda}</span>
          </div>
          <div>
            <strong>Jugadores colocados:</strong>{" "}
            <span id="jugadoresColocados">{cantidadColocados}</span>
          </div>
        </div>

        <div id="mensajeJuego" className="mensajeJuego">
          {mensaje}
        </div>

        <div className="barraProgreso">
          <div
            id="rellenoProgreso"
            className="rellenoProgreso"
            style={{ width: `${progreso}%` }}
          ></div>
        </div>

        <div id="textoProgreso" style={{ fontSize: "13px", opacity: 0.9 }}>
          {cantidadColocados} de {POSICIONES.length} posiciones completas
        </div>

        <div className="areaEntrada">
          <input
            id="entradaJugador"
            type="text"
            list="sugerenciasJugadores"
            placeholder="Escribí el nombre del jugador"
            value={entradaJugador}
            onChange={(e) => setEntradaJugador(e.target.value)}
          />
          <datalist id="sugerenciasJugadores">
            {sugerenciasJugadores.map((nombre) => (
              <option key={normalizarTexto(nombre)} value={nombre} />
            ))}
          </datalist>

          {/* Tu compañero puede reemplazar este botón por su componente <Button> */}
          <button
            id="botonReiniciar"
            type="button"
            onClick={() => cargarJugadores()}
          >
            Reiniciar
          </button>
        </div>
      </div>

      <div className="cancha">
        <div className="fila delanteros" id="delanteros">
          {renderFilaGrupo("delanteros")}
        </div>
        <div className="fila mediocampistas" id="mediocampistas">
          {renderFilaGrupo("mediocampistas")}
        </div>
        <div className="fila defensas" id="defensas">
          {renderFilaGrupo("defensas")}
        </div>
        <div className="fila arquero" id="arquero">
          {renderFilaGrupo("arquero")}
        </div>
      </div>
    </>
  );
}

// Ruta /fulbo11: GameLobby pide primero el modo y mantiene montada la conexión durante la partida.
export default function Fulbo11Page() {
  return (
    <GameLobby game="futbol11">
      <Fulbo11Game />
    </GameLobby>
  );
}
