// src/app/grid/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import "../global.css";
import GameLobby, { useGameSession } from "../../components/GameLobby";

const BACKEND = "http://localhost:4000";
const MINIMO_JUGADORES = 3;

// Cachés en memoria de imágenes externas; evitan pedir de nuevo el mismo recurso mientras viva la página.
const cacheFotosJugadores = {};
const cacheFotosEquipos = {};

// Normaliza países y clubes para que una tilde o diferencia de mayúsculas no rompa una coincidencia.
function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Ordena texto normalizado por código de caracteres para que ambos navegadores evalúen el mismo orden.
function compararTexto(a, b) {
  const textoA = normalizarTexto(a);
  const textoB = normalizarTexto(b);
  return textoA < textoB ? -1 : textoA > textoB ? 1 : 0;
}

// Crea un generador aleatorio repetible para que ambos clientes compartan el tablero de la sala.
function crearGeneradorAleatorio(semilla) {
  let estado = 2166136261;
  String(semilla).split("").forEach((caracter) => {
    estado = Math.imul(estado ^ caracter.charCodeAt(0), 16777619);
  });
  estado >>>= 0;
  if (estado === 0) estado = 1;

  return () => {
    let valor = (estado += 0x6d2b79f5);
    valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
    valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
    return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
  };
}

// Devuelve las selecciones únicas para revisar sistemáticamente las combinaciones disponibles.
function obtenerCombinaciones(elementos, cantidad) {
  const combinaciones = [];

  const construir = (inicio, actual) => {
    if (actual.length === cantidad) {
      combinaciones.push(actual);
      return;
    }

    for (
      let indice = inicio;
      indice <= elementos.length - (cantidad - actual.length);
      indice++
    ) {
      construir(indice + 1, [...actual, elementos[indice]]);
    }
  };

  construir(0, []);
  return combinaciones;
}

// Crea un índice jugador -> clubes. Set guarda clubes únicos; es una colección nativa de JS.
function crearEquiposJugador(trayectorias) {
  const equiposJugador = {};
  trayectorias.forEach(({ id_jugador, id_equipo }) => {
    if (!equiposJugador[id_jugador]) equiposJugador[id_jugador] = new Set();
    equiposJugador[id_jugador].add(id_equipo);
  });
  return equiposJugador;
}

// Crea un índice país-club -> jugadores; así se consulta una celda sin volver a recorrer toda la lista.
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

// Unifica países ignorando mayúsculas o tildes y elige una escritura estable para ambos clientes.
function obtenerPaises(jugadores) {
  const paisesPorClave = new Map();
  jugadores.forEach((j) => {
    const normalizado = normalizarTexto(j.pais);
    if (!j.pais || !normalizado) return;

    const nombre = String(j.pais).trim();
    const nombreGuardado = paisesPorClave.get(normalizado);
    if (!nombreGuardado || nombre < nombreGuardado) {
      paisesPorClave.set(normalizado, nombre);
    }
  });
  return Array.from(paisesPorClave.values()).map((nombre) => ({ nombre }));
}

// Recupera los jugadores que cumplen la combinación de una celda.
function obtenerJugadoresCelda(pais, equipo, conexiones) {
  return conexiones[`${normalizarTexto(pais.nombre)}_${equipo.id}`] || [];
}

// Crea el objeto de respuestas válidas para las nueve celdas.
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

// Busca la mejor grilla completa y relaja el número de respuestas o encabezados solo si hace falta.
function buscarGrilla(paises, equipos, conexiones, semilla) {
  const aleatorio = crearGeneradorAleatorio(semilla);
  const equiposOrdenados = [...equipos].sort(
    (a, b) => a.id - b.id || compararTexto(a.nombre, b.nombre)
  );
  const paisesDisponibles = paises
    .filter((pais) =>
      equiposOrdenados.some(
        (equipo) => obtenerJugadoresCelda(pais, equipo, conexiones).length > 0
      )
    )
    .sort((a, b) => compararTexto(a.nombre, b.nombre));

  // Se priorizan nueve cruces únicos; si no existen, se duplica un encabezado válido para completar la grilla.
  const dimensiones = [
    [3, 3], [3, 2], [2, 3], [2, 2], [3, 1], [1, 3], [2, 1], [1, 2], [1, 1],
  ];

  for (const [cantidadFilas, cantidadColumnas] of dimensiones) {
    for (const minimoRespuestas of [MINIMO_JUGADORES, 1]) {
      let mejorGrilla = null;
      let cantidadEmpates = 0;
      const combinacionesFilas = obtenerCombinaciones(
        paisesDisponibles,
        cantidadFilas
      );

      combinacionesFilas.forEach((filasElegidas) => {
        const equiposComunes = equiposOrdenados
          .map((equipo) => ({
            equipo,
            jugadoresPorFila: filasElegidas.map(
              (pais) => obtenerJugadoresCelda(pais, equipo, conexiones)
            ),
          }))
          .filter(({ jugadoresPorFila }) =>
            jugadoresPorFila.every((lista) => lista.length >= minimoRespuestas)
          )
          .map((conexion) => ({
            ...conexion,
            minimo: Math.min(...conexion.jugadoresPorFila.map((lista) => lista.length)),
            total: conexion.jugadoresPorFila.reduce((suma, lista) => suma + lista.length, 0),
            desempate: aleatorio(),
          }))
          .sort((a, b) => b.minimo - a.minimo || b.total - a.total || a.desempate - b.desempate);

        if (equiposComunes.length < cantidadColumnas) return;

        // Se prefieren las columnas con más respuestas posibles y mejor equilibrio entre países.
        const columnasElegidas = equiposComunes
          .slice(0, cantidadColumnas)
          .map(({ equipo }) => equipo);
        const filasFinales = [...filasElegidas];
        const columnasFinales = [...columnasElegidas];
        while (filasFinales.length < 3) filasFinales.push(filasElegidas[0]);
        while (columnasFinales.length < 3) columnasFinales.push(columnasElegidas[0]);

        const cantidades = filasFinales.flatMap((pais) =>
          columnasFinales.map(
            (equipo) => obtenerJugadoresCelda(pais, equipo, conexiones).length
          )
        );
        const candidato = {
          filas: filasFinales,
          columnas: columnasFinales,
          minimo: Math.min(...cantidades),
          total: cantidades.reduce((suma, cantidad) => suma + cantidad, 0),
        };

        if (
          !mejorGrilla ||
          candidato.minimo > mejorGrilla.minimo ||
          (candidato.minimo === mejorGrilla.minimo && candidato.total > mejorGrilla.total)
        ) {
          mejorGrilla = candidato;
          cantidadEmpates = 1;
        } else if (
          candidato.minimo === mejorGrilla.minimo &&
          candidato.total === mejorGrilla.total
        ) {
          cantidadEmpates++;
          if (aleatorio() < 1 / cantidadEmpates) mejorGrilla = candidato;
        }
      });

      if (mejorGrilla) {
        return {
          filas: mejorGrilla.filas,
          columnas: mejorGrilla.columnas,
          jugadores: crearDatosGrilla(
            mejorGrilla.filas,
            mejorGrilla.columnas,
            conexiones
          ),
        };
      }
    }
  }

  // Solo devuelve null si la base no tiene ni una combinación país-club con jugadores.
  return null;
}

// Consulta TheSportsDB, una API externa de imágenes; guarda éxitos para no repetir la misma búsqueda.
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

// Uso: contenido del lobby del Grid. En una sala, ambos clientes comparten los encabezados.
function GridGame() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();

  // Conserva la grilla compartida, las respuestas locales, la celda activa y el estado de carga.
  const [grilla, setGrilla] = useState(null);
  const [todosLosJugadores, setTodosLosJugadores] = useState([]);
  const [error, setError] = useState("");
  const [escudos, setEscudos] = useState({});
  const [celdaActiva, setCeldaActiva] = useState(null); // { fila, col }
  const [celdasReveladas, setCeldasReveladas] = useState({}); // { r0_c0: { apellido, foto } }
  const [busqueda, setBusqueda] = useState("");
  const [respuestaFeed, setRespuestaFeed] = useState("");
  const codigoSala = sala?.room;

  // Busca la mejor grilla posible; el código de sala hace que los dos clientes obtengan el mismo tablero.
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

      if (equipos.length === 0 || jugadores.length === 0) {
        setError("No hay suficientes datos.");
        return;
      }

      // El autocompletado incluye toda la tabla de jugadores, sin usar los cruces de la celda activa.
      const nombresJugadores = new Map();
      jugadores.forEach((jugador) => {
        const nombreCompleto = `${jugador.nombre || ""} ${jugador.apellido || ""}`.trim();
        const clave = normalizarTexto(nombreCompleto);
        if (clave && !nombresJugadores.has(clave)) {
          nombresJugadores.set(clave, nombreCompleto);
        }
      });
      setTodosLosJugadores(
        Array.from(nombresJugadores.values()).sort((a, b) => a.localeCompare(b, "es"))
      );

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
        conexiones,
        codigoSala || `${Date.now()}-${Math.random()}`
      );

      if (!nuevaGrilla) {
        setError("No hay jugadores vinculados a clubes para crear una grilla.");
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
  }, [codigoSala]);

  // Carga inicial en el navegador una vez montado el juego.
  useEffect(() => {
    Promise.resolve().then(cargarGrilla);
  }, [cargarGrilla]);

  // Selecciona una celda sin permitir volver a contestar las ya resueltas.
  const seleccionarCelda = (fila, col) => {
    const clave = `r${fila}_c${col}`;
    if (celdasReveladas[clave]) return; // Si ya fue adivinada, no hacer nada
    setCeldaActiva({ fila, col });
    setBusqueda("");
    setRespuestaFeed("");
  };

  // Busca la respuesta escrita entre los jugadores válidos y obtiene una foto si acertó.
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
  const terminoLaPartida = Boolean(grilla && celdasCompletadas === 9);

  // En online publica encabezados y casillas resueltas, nunca el nombre que permitiría copiar la respuesta.
  useEffect(() => {
    enviarProgreso({
      celdasCompletadas,
      puntaje: celdasCompletadas,
      terminado: terminoLaPartida,
      filas: grilla ? grilla.filas.map((fila) => fila.nombre) : [],
      columnas: grilla ? grilla.columnas.map((columna) => columna.nombre) : [],
      celdasReveladas: Object.fromEntries(
        Object.keys(celdasReveladas).map((clave) => [clave, "✓"])
      ),
    });
    if (terminoLaPartida) marcarPartidaTerminada();
  }, [
    celdasCompletadas,
    celdasReveladas,
    grilla,
    terminoLaPartida,
    modo,
    sala?.status,
    enviarProgreso,
    marcarPartidaTerminada,
  ]);

  return (
    <main className="gridGame">
      {grilla && !error && (
        <div className="gridDesbordamiento">
          <div className="grid">
          {/* Esquina superior izquierda */}
          <div className="cell logo title">
            FULBO11
            <br />
            GRID
          </div>

          {/* Encabezados de Equipos (Columnas) */}
          {grilla.columnas.map((eq, indice) => (
            <div key={`${eq.id}-${indice}`} className="cell logo">
              {escudos[eq.id] && (
                <Image
                  src={escudos[eq.id]}
                  alt={eq.nombre}
                  width={40}
                  height={40}
                  unoptimized
                  style={{ objectFit: "contain" }}
                />
              )}
              <span>{eq.nombre}</span>
            </div>
          ))}

          {/* Filas (País + 3 celdas de jugadores) */}
          {grilla.filas.map((pais, f) => (
            <div key={`${pais.nombre}-${f}`} style={{ display: "contents" }}>
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
                          <Image
                            src={revelada.foto}
                            alt={revelada.apellido}
                            width={60}
                            height={60}
                            unoptimized
                            style={{ objectFit: "contain" }}
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
        </div>
      )}

      {/* Contenedor de resultados / buscador */}
      <div id="results" className="results gridResults">
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
              {todosLosJugadores.map((nombre) => (
                <option key={normalizarTexto(nombre)} value={nombre} />
              ))}
            </datalist>

            <p id="respuestaFeed" style={{ marginTop: "10px", fontWeight: "bold" }}>
              {respuestaFeed}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// Ruta /grid: el lobby debe quedar montado para conservar la conexión al pasar del menú al juego.
export default function GridPage() {
  return (
    <GameLobby game="grid">
      <GridGame />
    </GameLobby>
  );
}
