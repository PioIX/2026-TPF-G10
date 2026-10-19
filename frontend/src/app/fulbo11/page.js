// src/app/fulbo11/page.js
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import "../global.css";

const URL_API = "http://localhost:4000";

const POSICIONES = [
  { numero: 7, nombre: "ED", grupo: "delanteros" },
  { numero: 9, nombre: "DC", grupo: "delanteros" },
  { numero: 11, nombre: "EI", grupo: "delanteros" },

  { numero: 8, nombre: "MC", grupo: "mediocampistas" },
  { numero: 10, nombre: "MCO", grupo: "mediocampistas" },
  { numero: 5, nombre: "MCD", grupo: "mediocampistas" },

  { numero: 3, nombre: "LI", grupo: "defensas" },
  { numero: 6, nombre: "DFC", grupo: "defensas" },
  { numero: 4, nombre: "DFC", grupo: "defensas" },
  { numero: 2, nombre: "LD", grupo: "defensas" },

  { numero: 1, nombre: "ARQ", grupo: "arquero" },
];

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function obtenerPaisAleatorio(listaJugadores) {
  const paises = [...new Set(listaJugadores.map((j) => j.pais))];
  if (paises.length === 0) return "Sin datos";
  return paises[Math.floor(Math.random() * paises.length)];
}

export default function Fulbo11Page() {
  const [jugadores, setJugadores] = useState([]);
  const [equipo, setEquipo] = useState(Array(POSICIONES.length).fill(null));
  const [posicionSeleccionada, setPosicionSeleccionada] = useState(null);
  const [paisActual, setPaisActual] = useState("");
  const [ronda, setRonda] = useState(0);
  const [entradaJugador, setEntradaJugador] = useState("");
  const [mensaje, setMensaje] = useState(
    "Seleccioná una posición vacía y escribí el nombre del jugador."
  );

  // Inicia o reinicia la partida con la lista de jugadores cargada
  const iniciarJuego = useCallback((listaJugadores) => {
    setEquipo(Array(POSICIONES.length).fill(null));
    setPosicionSeleccionada(null);
    setRonda(1);
    setPaisActual(obtenerPaisAleatorio(listaJugadores));
    setEntradaJugador("");
    setMensaje("Seleccioná una posición vacía y escribí el nombre del jugador.");
  }, []);

  // Carga los jugadores desde el backend al montar la página
  const cargarJugadores = useCallback(async () => {
    try {
      const respuesta = await fetch(`${URL_API}/jugadores`);
      const datos = await respuesta.json();

      if (Array.isArray(datos) && datos.length > 0) {
        // Usamos un Map por id_jugador para no duplicar jugadores con varios clubes en su trayectoria
        const mapaUnicos = new Map();
        datos.forEach((jugador) => {
          if (jugador && (jugador.pais || jugador.country) && !mapaUnicos.has(jugador.id_jugador)) {
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

  useEffect(() => {
    cargarJugadores();
  }, [cargarJugadores]);

  // Avanza a la siguiente ronda sorteando un nuevo país
  const siguienteRonda = () => {
    setRonda((prev) => prev + 1);
    setPaisActual(obtenerPaisAleatorio(jugadores));
    setPosicionSeleccionada(null);
    setEntradaJugador("");
  };

  // Maneja el click en cada posición de la cancha
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

    // 3. Busca coincidencias exactas por nombre
    const coincidencias = jugadores.filter(
      (j) => normalizarTexto(j.nombre) === normalizarTexto(texto)
    );

    if (coincidencias.length === 0) {
      setMensaje("No encontré ese jugador.");
      return;
    }

    // Si hay homónimos, priorizamos el que coincida con el país actual
    const jugador =
      coincidencias.find((j) => j.pais === paisActual) || coincidencias[0];

    // 4. Verifica que pertenezca al país de la ronda actual
    if (jugador.pais !== paisActual) {
      setMensaje("Ese jugador no pertenece al país mostrado.");
      return;
    }

    // 5. Verifica si el jugador puede jugar en esa posición (ej: "10-7" -> ['10', '7'])
    const posicionesPermitidas = String(jugador.posicion).split("-");
    if (!posicionesPermitidas.includes(String(posicion.numero))) {
      setMensaje(`${jugador.nombre} no puede jugar de ${posicion.nombre}.`);
      return;
    }

    // 6. Evita poner al mismo jugador dos veces en la cancha
    if (equipo.some((asignado) => asignado && asignado.id === jugador.id)) {
      setMensaje(`${jugador.nombre} ya está en la formación.`);
      return;
    }

    // Si pasa todas las validaciones, lo colocamos en el equipo
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
    siguienteRonda();
  };

  // Cálculos derivados para la barra de progreso y contadores
  const cantidadColocados = equipo.filter(Boolean).length;
  const progreso = Math.round((cantidadColocados / POSICIONES.length) * 100);

  // Lista de sugerencias autocompletadas (máximo 12)
  const sugerencias = useMemo(() => {
    const valor = normalizarTexto(entradaJugador);
    if (!valor) return [];

    return jugadores
      .filter((jugador) => {
        const coincideTexto = normalizarTexto(jugador.nombre).includes(valor);
        const coincidePais =
          normalizarTexto(jugador.pais) === normalizarTexto(paisActual);
        return coincideTexto && coincidePais;
      })
      .slice(0, 12);
  }, [entradaJugador, jugadores, paisActual]);

  // Renderiza los botones de un grupo específico de la cancha
  const renderFilaGrupo = (nombreGrupo) => {
    return POSICIONES.map((posicion, indice) => {
      if (posicion.grupo !== nombreGrupo) return null;

      const asignado = equipo[indice];
      const estaSeleccionado = posicionSeleccionada === indice;

      return (
        <button
          key={posicion.numero}
          type="button"
          className={`casillero ${estaSeleccionado ? "casilleroSeleccionado" : ""} ${
            asignado ? "casilleroOcupado ocupado" : ""
          }`}
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
      {/* Tu compañero puede reemplazar este header por su componente <Title> */}
      <header>
        <h1>FULBO 11</h1>
        <Link href="/">
          <img src="/img/logo.png" alt="Logo" />
        </Link>
      </header>
      <hr />

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
            {sugerencias.map((j) => (
              <option key={j.id} value={j.nombre} />
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