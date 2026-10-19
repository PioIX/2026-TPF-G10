// src/app/grid/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "../global.css";
import GameLobby, { useGameSession } from "../../components/GameLobby";

const BACKEND = "http://localhost:4000";
const MINIMO_JUGADORES = 3;
const MAXIMOS_INTENTOS = 1000;

// Caché en memoria para no repetir peticiones a TheSportsDB
const cacheFotosJugadores = {};
const cacheFotosEquipos = {};

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mezclarArray(array) {
  const nuevoArray = [...array];
  for (let i = nuevoArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nuevoArray[i], nuevoArray[j]] = [nuevoArray[j], nuevoArray[i]];
  }
  return nuevoArray;
}

function crearEquiposJugador(trayectorias) {
  const equiposJugador = {};
  trayectorias.forEach(({ id_jugador, id_equipo }) => {
    if (!equiposJugador[id_jugador]) equiposJugador[id_jugador] = new Set();
    equiposJugador[id_jugador].add(id_equipo);
  });
  return equiposJugador;
}

function crearConexiones(jugadores, equiposJugador) {
  const conexiones = {};
  jugadores.forEach((j) => {
    const equipos = equiposJugador[j.id_jugador];
    if (!equipos) return;

    equipos.forEach((idEquipo) => {
      const clave = `${normalizarTexto(j.pais)}_${idEquipo}`;
      if (!conexiones[clave]) conexiones[clave] = [];
      conexiones[clave].push({
        id: j.id_jugador,
        nombre: j.nombre,
        apellido: j.apellido,
        pais: j.pais,
      });
    });
  });
  return conexiones;
}

function obtenerPaises(jugadores) {
  const vistos = new Set();
  const paises = [];
  jugadores.forEach((j) => {
    const normalizado = normalizarTexto(j.pais);
    if (j.pais && !vistos.has(normalizado)) {
      vistos.add(normalizado);
      paises.push({ nombre: j.pais });
    }
  });
  return paises;
}

function obtenerJugadoresCelda(pais, equipo, conexiones) {
  return conexiones[`${normalizarTexto(pais.nombre)}_${equipo.id}`] || [];
}

function filtrarPaises(paises, equipos, conexiones) {
  return paises.filter((pais) => {
    let cantidadConexiones = 0;
    equipos.forEach((equipo) => {
      if (
        obtenerJugadoresCelda(pais, equipo, conexiones).length >=
        MINIMO_JUGADORES
      ) {
        cantidadConexiones++;
      }
    });
    return cantidadConexiones >= 3;
  });
}

function filtrarEquipos(paises, equipos, conexiones) {
  return equipos.filter((equipo) => {
    let cantidadConexiones = 0;
    paises.forEach((pais) => {
      if (
        obtenerJugadoresCelda(pais, equipo, conexiones).length >=
        MINIMO_JUGADORES
      ) {
        cantidadConexiones++;
      }
    });
    return cantidadConexiones >= 3;
  });
}

function validarGrilla(paises, equipos, conexiones) {
  for (let f = 0; f < 3; f++) {
    for (let c = 0; c < 3; c++) {
      if (
        obtenerJugadoresCelda(paises[f], equipos[c], conexiones).length <
        MINIMO_JUGADORES
      ) {
        return false;
      }
    }
  }
  return true;
}

function crearDatosGrilla(paises, equipos, conexiones) {
  const jugadoresPorCelda = {};
  for (let f = 0; f < 3; f++) {
    for (let c = 0; c < 3; c++) {
      jugadoresPorCelda[`r${f}_c${c}`] = obtenerJugadoresCelda(
        paises[f],
        equipos[c],
        conexiones
      );
    }
  }
  return jugadoresPorCelda;
}

function buscarGrilla(paises, equipos, conexiones) {
  const paisesDisponibles = filtrarPaises(paises, equipos, conexiones);
  const equiposDisponibles = filtrarEquipos(
    paisesDisponibles,
    equipos,
    conexiones
  );

  if (paisesDisponibles.length < 3 || equiposDisponibles.length < 3) return null;

  for (let i = 0; i < MAXIMOS_INTENTOS; i++) {
    const pPrueba = mezclarArray(paisesDisponibles).slice(0, 3);
    const ePrueba = mezclarArray(equiposDisponibles).slice(0, 3);

    if (validarGrilla(pPrueba, ePrueba, conexiones)) {
      return {
        filas: pPrueba,
        columnas: ePrueba,
        jugadores: crearDatosGrilla(pPrueba, ePrueba, conexiones),
      };
    }
  }
  return null;
}

async function consultarAPI(url, claveCache, propiedadDato) {
  const cache =
    propiedadDato === "player" ? cacheFotosJugadores : cacheFotosEquipos;
  if (cache[claveCache]) return cache[claveCache];

  try {
    const res = await fetch(url);
    const datos = await res.json();
    const lista = datos[propiedadDato];
    if (lista && lista.length > 0) {
      const recurso =
        lista[0].strCutout || lista[0].strThumb || lista[0].strBadge || "";
      cache[claveCache] = recurso;
      return recurso;
    }
  } catch (e) {
    console.error("Error en API externa:", e);
  }
  return "";
}

function GridGame() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();
  const [grilla, setGrilla] = useState(null);
  const [error, setError] = useState("");
  const [escudos, setEscudos] = useState({});
  const [celdaActiva, setCeldaActiva] = useState(null); // { fila, col }
  const [celdasReveladas, setCeldasReveladas] = useState({}); // { r0_c0: { apellido, foto } }
  const [busqueda, setBusqueda] = useState("");
  const [respuestaFeed, setRespuestaFeed] = useState("");

  const cargarGrilla = useCallback(async () => {
    try {
      setError("");
      setCeldaActiva(null);
      setCeldasReveladas({});

      const res = await fetch(`${BACKEND}/grid`);
      const datos = await res.json();

      const equipos = Array.isArray(datos.equipos) ? datos.equipos : [];
      const jugadores = Array.isArray(datos.jugadores) ? datos.jugadores : [];
      const trayectorias = Array.isArray(datos.trayectorias)
        ? datos.trayectorias
        : [];

      if (equipos.length < 3 || jugadores.length === 0) {
        setError("No hay suficientes datos.");
        return;
      }

      const conexiones = crearConexiones(
        jugadores,
        crearEquiposJugador(trayectorias)
      );
      const listaEquipos = equipos.map((e) => ({
        id: e.id_equipo,
        nombre: e.nombre_equipo,
      }));
      const nuevaGrilla = buscarGrilla(
        obtenerPaises(jugadores),
        listaEquipos,
        conexiones
      );

      if (!nuevaGrilla) {
        setError("No existe una combinación válida con los datos actuales.");
        return;
      }

      setGrilla(nuevaGrilla);

      // Buscar los escudos de los 3 equipos seleccionados
      nuevaGrilla.columnas.forEach((eq) => {
        const clave = normalizarTexto(eq.nombre);
        consultarAPI(
          `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(
            eq.nombre
          )}`,
          clave,
          "teams"
        ).then((escudoUrl) => {
          if (escudoUrl) {
            setEscudos((prev) => ({ ...prev, [eq.id]: escudoUrl }));
          }
        });
      });
    } catch (e) {
      console.error(e);
      setError("Error al cargar la grilla.");
    }
  }, []);

  useEffect(() => {
    cargarGrilla();
  }, [cargarGrilla]);

  const seleccionarCelda = (fila, col) => {
    const clave = `r${fila}_c${col}`;
    if (celdasReveladas[clave]) return; // Si ya fue adivinada, no hacer nada
    setCeldaActiva({ fila, col });
    setBusqueda("");
    setRespuestaFeed("");
  };

  const comprobarJugador = async () => {
    if (!celdaActiva || !grilla) return;

    const clave = `r${celdaActiva.fila}_c${celdaActiva.col}`;
    const jugadoresValidos = grilla.jugadores[clave] || [];
    const buscado = normalizarTexto(busqueda);

    const encontrado = jugadoresValidos.find(
      (j) => normalizarTexto(`${j.nombre} ${j.apellido}`) === buscado
    );

    if (encontrado) {
      setRespuestaFeed("Correcto");

      // Guardamos primero el apellido para mostrarlo inmediatamente
      setCeldasReveladas((prev) => ({
        ...prev,
        [clave]: { apellido: encontrado.apellido, foto: "" },
      }));

      // Buscamos la foto del jugador en TheSportsDB
      const nombreCompleto = `${encontrado.nombre} ${encontrado.apellido}`;
      const fotoUrl = await consultarAPI(
        `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(
          nombreCompleto
        )}`,
        normalizarTexto(nombreCompleto),
        "player"
      );

      if (fotoUrl) {
        setCeldasReveladas((prev) => ({
          ...prev,
          [clave]: { ...prev[clave], foto: fotoUrl },
        }));
      }
    } else {
      setRespuestaFeed("Jugador incorrecto");
    }
  };

  const claveActiva = celdaActiva
    ? `r${celdaActiva.fila}_c${celdaActiva.col}`
    : null;
  const jugadoresCeldaActiva =
    (claveActiva && grilla?.jugadores[claveActiva]) || [];
  const celdasCompletadas = Object.keys(celdasReveladas).length;
  const terminoLaPartida = celdasCompletadas === 9;

  // El puntaje compartido representa las celdas correctas hasta que se defina otro sistema.
  useEffect(() => {
    enviarProgreso({
      celdasCompletadas,
      puntaje: celdasCompletadas,
      terminado: terminoLaPartida,
      filas: grilla ? grilla.filas.map((fila) => fila.nombre) : [],
      columnas: grilla ? grilla.columnas.map((columna) => columna.nombre) : [],
      celdasReveladas: Object.fromEntries(
        Object.entries(celdasReveladas).map(([clave, celda]) => [clave, celda.apellido])
      ),
    });
    if (terminoLaPartida) marcarPartidaTerminada();
  }, [
    celdasCompletadas,
    celdasReveladas,
    grilla,
    terminoLaPartida,
    modo,
    sala && sala.status,
    enviarProgreso,
    marcarPartidaTerminada,
  ]);

  return (
    <>
      {grilla && !error && (
        <div className="grid">
          {/* Esquina superior izquierda */}
          <div className="cell logo title">
            FULBO11
            <br />
            GRID
          </div>

          {/* Encabezados de Equipos (Columnas) */}
          {grilla.columnas.map((eq) => (
            <div key={eq.id} className="cell logo">
              {escudos[eq.id] && (
                <img
                  src={escudos[eq.id]}
                  alt={eq.nombre}
                  style={{ width: "40px", height: "40px", objectFit: "contain" }}
                />
              )}
              <span>{eq.nombre}</span>
            </div>
          ))}

          {/* Filas (País + 3 celdas de jugadores) */}
          {grilla.filas.map((pais, f) => (
            <div key={pais.nombre} style={{ display: "contents" }}>
              <div className="cell logo">{pais.nombre}</div>

              {[0, 1, 2].map((c) => {
                const clave = `r${f}_c${c}`;
                const revelada = celdasReveladas[clave];

                return (
                  <div
                    key={clave}
                    className={`cell player clickable ${
                      revelada ? "found" : ""
                    }`}
                    style={{
                      pointerEvents: revelada ? "none" : "auto",
                      cursor: revelada ? "default" : "pointer",
                      flexDirection: "column",
                    }}
                    onClick={() => seleccionarCelda(f, c)}
                  >
                    {revelada ? (
                      <>
                        {revelada.foto && (
                          <img
                            src={revelada.foto}
                            alt={revelada.apellido}
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "contain",
                            }}
                          />
                        )}
                        <div style={{ fontWeight: 700 }}>
                          {revelada.apellido}
                        </div>
                      </>
                    ) : (
                      "?"
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Contenedor de resultados / buscador */}
      <div id="results" className="results" style={{ textAlign: "center", marginBottom: "40px" }}>
        {error && <p>{error}</p>}

        {celdaActiva && !error && (
          <div>
            <h3 style={{ marginBottom: "10px" }}>
              Celda ({celdaActiva.fila + 1}, {celdaActiva.col + 1}) -{" "}
              {jugadoresCeldaActiva.length} jugador(es)
            </h3>
            <input
              type="text"
              placeholder="Buscar jugador..."
              id="buscadorJugador"
              list="listaJugadores"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") comprobarJugador();
              }}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "none" }}
            />
            {/* Tu compañero puede reemplazar este botón por su componente <Button> */}
            <button
              id="btnProbar"
              type="button"
              onClick={comprobarJugador}
              style={{
                marginLeft: "10px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: "var(--color-boton)",
                color: "var(--color-texto-oscuro)",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Probar
            </button>

            <datalist id="listaJugadores">
              {jugadoresCeldaActiva.map((j) => (
                <option key={j.id} value={`${j.nombre} ${j.apellido}`} />
              ))}
            </datalist>

            <p id="respuestaFeed" style={{ marginTop: "10px", fontWeight: "bold" }}>
              {respuestaFeed}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// Cada persona genera su propia grilla al comenzar su partida.
export default function GridPage() {
  return (
    <GameLobby game="grid">
      <GridGame />
    </GameLobby>
  );
}
