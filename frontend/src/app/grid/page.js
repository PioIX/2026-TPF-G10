// src/app/grid/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import "../global.css";
import GameLobby, { useGameSession } from "../../components/GameLobby";
import GoalCelebration from "../../components/GoalCelebration";
import GridBoard from "../../components/GridBoard";
import CellSearchPanel from "../../components/CellSearchPanel";
import ResultCard from "../../components/ResultCard";
import { BACKEND_URL } from "../../config/backend";
import { comentarioFutbolero } from "../../utils/comentariosFutboleros";

const BACKEND = BACKEND_URL;
const MINIMO_JUGADORES = 3;

/*
 * Reglas del Grid:
 * - Cada fila representa un país y cada columna un club; una celda es la intersección de ambos.
 * - La respuesta válida se prepara a partir de la nacionalidad y la trayectoria de cada jugador.
 * - El selector sugiere todos los jugadores de la base, pero al enviar se valida contra la celda activa.
 * - En una sala se usa el código como semilla para que ambos vean los mismos encabezados; sus respuestas
 *   se mantienen separadas y solo se comparte cuáles celdas ya resolvió cada persona.
 */

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

// Mezcla una copia de la lista usando el generador de la sala para conservar el mismo resultado en ambos clientes.
function mezclarArray(array, aleatorio) {
  const resultado = [...array];
  for (let indice = resultado.length - 1; indice > 0; indice--) {
    const otroIndice = Math.floor(aleatorio() * (indice + 1));
    [resultado[indice], resultado[otroIndice]] = [
      resultado[otroIndice],
      resultado[indice],
    ];
  }
  return resultado;
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

// Busca grillas válidas y sortea entre opciones de buena calidad para dar variedad entre partidas.
function buscarGrilla(paises, equipos, conexiones, semilla) {
  const aleatorio = crearGeneradorAleatorio(semilla);
  const MAX_EQUIPOS_CANDIDATOS = 12;
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
      let grillaElegida = null;
      let pesoAcumulado = 0;
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
            equipo: conexion.equipo,
            minimo: Math.min(...conexion.jugadoresPorFila.map((lista) => lista.length)),
            total: conexion.jugadoresPorFila.reduce((suma, lista) => suma + lista.length, 0),
          }))
          .sort((a, b) => b.minimo - a.minimo || b.total - a.total);

        if (equiposComunes.length < cantidadColumnas) return;

        // Baraja entre los doce clubes más compatibles, en vez de elegir siempre los mismos tres.
        const equiposCandidatos = equiposComunes.slice(
          0,
          Math.max(cantidadColumnas, MAX_EQUIPOS_CANDIDATOS)
        );
        const columnasElegidas = mezclarArray(equiposCandidatos, aleatorio)
          .slice(0, cantidadColumnas)
          .map(({ equipo }) => equipo);
        const filasFinales = mezclarArray(filasElegidas, aleatorio);
        const columnasFinales = [...columnasElegidas];
        while (filasFinales.length < 3) filasFinales.push(filasFinales[0]);
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

        // El muestreo ponderado favorece grillas con más respuestas, pero también permite elegir otras válidas.
        const peso = 1 + candidato.minimo * 20 + candidato.total;
        pesoAcumulado += peso;
        if (aleatorio() * pesoAcumulado < peso) grillaElegida = candidato;
      });

      if (grillaElegida) {
        return {
          filas: grillaElegida.filas,
          columnas: grillaElegida.columnas,
          jugadores: crearDatosGrilla(
            grillaElegida.filas,
            grillaElegida.columnas,
            conexiones
          ),
        };
      }
    }
  }

  // Solo devuelve null si la base no tiene ni una combinación país-club con jugadores.
  return null;
}

// Uso: contenido del lobby del Grid. En una sala, la misma semilla genera los mismos encabezados
// en ambos navegadores; cada navegador conserva sus propias celdas completadas.
function GridGame() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();

  // Conserva la grilla compartida, las respuestas locales, la celda activa y el estado de carga.
  const [grilla, setGrilla] = useState(null);
  const [todosLosJugadores, setTodosLosJugadores] = useState([]);
  const [error, setError] = useState("");
  const [celdaActiva, setCeldaActiva] = useState(null); // { fila, col }
  const [celdasReveladas, setCeldasReveladas] = useState({}); // { r0_c0: { nombre, apellido } }
  const [respuestaFeed, setRespuestaFeed] = useState("");
  const codigoSala = sala?.room;

  // Carga tablas base, arma el índice país-club, genera el tablero y pide los escudos seleccionados.
  // El código de sala se usa como semilla para sincronizar el tablero sin transmitirlo por Socket.IO.
  const cargarGrilla = useCallback(async () => {
    try {
      setError("");
      setCeldaActiva(null);
      setCeldasReveladas({});
      setGrilla(null);

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

      // El autocompletado muestra todos los jugadores, aunque no correspondan a la celda activa.
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
    setRespuestaFeed("");
  };

  // El botón "Probar" o Enter llegan acá. El nombre sugerido no basta: debe estar en las respuestas
  // válidas de la celda seleccionada; si acierta, se revela el apellido y se intenta cargar su foto.
  const comprobarJugador = (texto) => {
    if (!celdaActiva || !grilla) return;

    const clave = `r${celdaActiva.fila}_c${celdaActiva.col}`;
    if (celdasReveladas[clave]) return;
    const jugadoresValidos = grilla.jugadores[clave] || [];
    const buscado = normalizarTexto(texto);

    const encontrado = jugadoresValidos.find(
      (j) => normalizarTexto(`${j.nombre} ${j.apellido}`) === buscado
    );

    if (encontrado) {
      setRespuestaFeed(`${comentarioFutbolero("acierto")} Correcto.`);

      // Guardamos primero el apellido para mostrarlo inmediatamente
      setCeldasReveladas((prev) => ({
        ...prev,
        [clave]: { nombre: encontrado.nombre, apellido: encontrado.apellido },
      }));
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

  // Puente entre la grilla local y el lobby. Payload: cantidad/puntaje, terminado,
  // nombres de filas/columnas y claves de celdas ya resueltas marcadas con ✓.
  // No manda el nombre ingresado ni la lista privada de respuestas posibles.
  useEffect(() => {
    enviarProgreso({ // El servidor vuelve a construir este snapshot antes de reenviarlo al rival.
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
      {terminoLaPartida && <GoalCelebration />}
      {grilla && !error && (
        <div className="gridDesbordamiento">
          <GridBoard
            grilla={grilla}
            celdasReveladas={celdasReveladas}
            onCelda={seleccionarCelda}
          />
        </div>
      )}

      {/* Contenedor de resultados / buscador */}
      <div id="results" className="results gridResults">
        {error && <p>{error}</p>}
        {celdaActiva && !error && (
          <CellSearchPanel
            key={`${celdaActiva.fila}-${celdaActiva.col}`}
            fila={celdaActiva.fila}
            columna={celdaActiva.col}
            opciones={todosLosJugadores}
            cantidadValidas={jugadoresCeldaActiva.length}
            onProbar={comprobarJugador}
            feedback={respuestaFeed}
            deshabilitado={Boolean(celdasReveladas[claveActiva]) || terminoLaPartida}
          />
        )}
        {terminoLaPartida && (
          <ResultCard
            gano
            titulo="¡Grid completo!"
            detalle="Resolviste los nueve cruces."
            onReiniciar={cargarGrilla}
            className="resultadoPartida"
          />
        )}
      </div>
    </main>
  );
}

export default function GridPage() {
  return (
    <GameLobby game="grid">
      <GridGame />
    </GameLobby>
  );
}
