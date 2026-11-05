// src/app/adivinaeljugador/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import "../global.css";
import GameLobby, { useGameSession } from "../../components/GameLobby";
import PlayerSilhouette from "../../components/PlayerSilhouette";
import GoalCelebration from "../../components/GoalCelebration";
import AnswerList from "../../components/AnswerList";
import DifficultyBadge from "../../components/DifficultyBadge";
import QuestionPanel from "../../components/QuestionPanel";
import GuessBox from "../../components/GuessBox";
import ClueBox from "../../components/ClueBox";
import LinkGallery from "../../components/LinkGallery";
import ResultCard from "../../components/ResultCard";
import { BACKEND_URL } from "../../config/backend";
import obtenerImagenDeportiva from "../../utils/imagenes";
import { comentarioFutbolero } from "../../utils/comentariosFutboleros";

const API_URL = BACKEND_URL;
const OPCIONES_POSICION = Array.from({ length: 11 }, (_, indice) =>
  String(indice + 1)
);

/*
 * Reglas de Adivina el jugador:
 * - El desafío se sortea desde la lista de jugadores de la base y cada participante tiene el suyo.
 * - Se pueden hacer hasta diez preguntas o intentos de adivinar.
 * - Las opciones del autocompletado vienen de toda la base; la respuesta se evalúa contra el secreto.
 * - Una posición es válida si aparece entre los códigos del jugador (por ejemplo, "11-10" acepta 10).
 * - En online se comparte el progreso y las preguntas, pero el servidor oculta el nombre acertado.
 */

// Normaliza la escritura para comparar nombres y respuestas ignorando tildes, signos y mayúsculas.
function limpiarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toLowerCase()
    .trim();
}

// /jugadores trae una fila por cada paso de trayectoria. Este armado vuelve a dejar un jugador
// por ID, guarda sus clubes en orden y separa el equipo actual de los clubes anteriores.
function construirJugadores(datos) {
  const jugadoresMap = new Map();
  const sugerenciasTemp = { club: [], pais: [], liga: [], nombres: [] };

  datos.forEach((fila) => {
    const id = fila.id_jugador;
    if (!id) return;

    if (!jugadoresMap.has(id)) {
      jugadoresMap.set(id, {
        id,
        nombre: `${fila.nombre || ""} ${fila.apellido || ""}`.trim(),
        pais: fila.pais || fila.country || "",
        posicion: fila.posicion || "",
        // La liga del club actual se usa para responder las preguntas de competición.
        ligaActual: fila.liga_actual || "",
        clubActual: fila.club_actual || "",
        edad: Number(fila.edad) || 0,
        altura: Number(fila.altura) || 0,
        trayectoria: [],
      });
    }

    const jugador = jugadoresMap.get(id);
    const club = fila.nombre_equipo || "";

    if (jugador.pais) sugerenciasTemp.pais.push(jugador.pais);
    if (jugador.ligaActual) sugerenciasTemp.liga.push(jugador.ligaActual);
    if (jugador.clubActual) sugerenciasTemp.club.push(jugador.clubActual);
    if (club) sugerenciasTemp.club.push(club);
    if (jugador.nombre) sugerenciasTemp.nombres.push(jugador.nombre);

    if (club) {
      jugador.trayectoria.push({
        club,
        ingreso: Number(fila.anio_ingreso) || 0,
        traspaso: Number(fila.anio_traspaso) || 0,
      });
    }
  });

  const sugerenciasLimpias = {
    club: Array.from(new Set(sugerenciasTemp.club)).sort(),
    pais: Array.from(new Set(sugerenciasTemp.pais)).sort(),
    posicion: OPCIONES_POSICION,
    liga: Array.from(new Set(sugerenciasTemp.liga)).sort(),
    nombres: Array.from(new Set(sugerenciasTemp.nombres)).sort(),
  };

  const listaJugadores = Array.from(jugadoresMap.values()).map((jugador) => {
    jugador.trayectoria.sort(
      (a, b) => a.ingreso - b.ingreso || a.traspaso - b.traspaso
    );
    if (!jugador.clubActual && jugador.trayectoria.length) {
      jugador.clubActual = jugador.trayectoria[jugador.trayectoria.length - 1].club;
    }
    jugador.clubes = [...new Set([
      ...jugador.trayectoria.map((t) => t.club),
      jugador.clubActual,
    ].filter(Boolean))];
    jugador.clubesPasados = jugador.trayectoria
      .map((t) => t.club)
      .filter((club) => limpiarTexto(club) !== limpiarTexto(jugador.clubActual));
    return jugador;
  });

  return { listaJugadores, sugerenciasLimpias };
}

// Uso: contenido del lobby de Adivina el jugador. Cada usuario sortea su propio jugador secreto.
function AdivinaElJugadorGame() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();

  // Estado agrupado por tarea: datos/sugerencias, pregunta, respuesta, pista, campos y resultado.
  const [jugadores, setJugadores] = useState([]);
  const [sugerencias, setSugerencias] = useState({
    club: [],
    pais: [],
    posicion: OPCIONES_POSICION,
    liga: [],
    nombres: [],
  });

  const [preguntasRestantes, setPreguntasRestantes] = useState(10);
  const [categoria, setCategoria] = useState(null);
  const [comparador, setComparador] = useState(null);
  const [valorRango, setValorRango] = useState(180);
  const [periodo, setPeriodo] = useState("actual");
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [jugadorSecreto, setJugadorSecreto] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [pistaActiva, setPistaActiva] = useState(false);
  const [mensaje, setMensaje] = useState(
    "Selecciona una categoría y haz tu primera pregunta."
  );

  const [inputTexto, setInputTexto] = useState("");
  const [inputAdivinar, setInputAdivinar] = useState("");
  const [fotoJugador, setFotoJugador] = useState("");
  const [companerosConImagen, setCompanerosConImagen] = useState([]);

  // Consulta el backend, agrupa las filas repetidas del JOIN y sortea el desafío local.
  const cargarJugadores = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/jugadores`);
      const datos = await respuesta.json();

      if (!Array.isArray(datos) || datos.length === 0) {
        setMensaje("No hay jugadores disponibles en el backend.");
      } else {
        const { listaJugadores, sugerenciasLimpias } =
          construirJugadores(datos);
        setJugadores(listaJugadores);
        setSugerencias(sugerenciasLimpias);

        const index = Math.floor(Math.random() * listaJugadores.length);
        setJugadorSecreto(listaJugadores[index]);
        setPistaActiva(false);
        setFotoJugador("");
        setMensaje("Selecciona categoría y haz una pregunta.");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error al cargar jugadores. Verifica el backend.");
    }
  }, []);

  // Efecto de montaje: la lectura HTTP ocurre en el navegador, no durante el render del servidor.
  useEffect(() => {
    Promise.resolve().then(cargarJugadores);
  }, [cargarJugadores]);

  // Carga la foto del jugador secreto para mostrar su silueta durante la partida.
  useEffect(() => {
    const nombre = jugadorSecreto?.nombre;
    if (!nombre) {
      setFotoJugador("");
      return;
    }

    let activo = true;
    setFotoJugador("");
    obtenerImagenDeportiva("jugador", nombre).then((imagen) => {
      if (activo) setFotoJugador(imagen);
    });

    return () => {
      activo = false;
    };
  }, [jugadorSecreto]);

  // Al pedir una pista, busca fotos de jugadores que compartieron club con el secreto.
  useEffect(() => {
    if (!pistaActiva || !jugadorSecreto) {
      setCompanerosConImagen([]);
      return undefined;
    }

    const clubesDelSecreto = new Set((jugadorSecreto.clubes || []).map(limpiarTexto));
    const companeros = jugadores
      .filter((jugador) => (
        jugador.id !== jugadorSecreto.id &&
        (jugador.clubes || []).some((club) => clubesDelSecreto.has(limpiarTexto(club)))
      ))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      .slice(0, 5);

    let activo = true;
    Promise.all(companeros.map(async (jugador) => ({
      nombre: jugador.nombre,
      imagen: await obtenerImagenDeportiva("jugador", jugador.nombre),
    }))).then((lista) => {
      if (activo) setCompanerosConImagen(lista);
    });

    return () => {
      activo = false;
    };
  }, [pistaActiva, jugadorSecreto, jugadores]);

  // Permite revisar el sorteo en desarrollo sin revelar el secreto en la versión publicada.
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && jugadorSecreto) {
      console.info("[Adivina el jugador] Secreto de desarrollo:", jugadorSecreto);
    }
  }, [jugadorSecreto]);

  // Valida opciones con la lista cargada y la comparación normalizada.
  const opcionValida = (cat, texto) => {
    if (!texto) return false;
    const opciones = sugerencias[cat] || [];
    return opciones.some(
      (opcion) => limpiarTexto(opcion) === limpiarTexto(texto)
    );
  };

  // Al cambiar la categoría se reinicia el comparador y se corrige el valor del slider si no aplica.
  const seleccionarCategoria = (cat) => {
    setCategoria(cat);
    setComparador(null);
    setInputTexto("");
    setMensaje(`Categoría actual: ${cat.toUpperCase()}.`);

    // Ajustar el rango por defecto según si eligió edad o altura
    if (cat === "edad" && (valorRango < 16 || valorRango > 45)) {
      setValorRango(25);
    } else if (cat === "altura" && (valorRango < 150 || valorRango > 210)) {
      setValorRango(180);
    }
  };

  // El comparador solo tiene sentido para edad y altura.
  const seleccionarComparador = (comp) => {
    if (!categoria) {
      setMensaje("Primero elige una categoría.");
    } else {
      setComparador(comp);
    }
  };

  // Habilita una pregunta solo cuando hay categoría y una respuesta/opción completa.
  const entradaPreguntaValida = () => {
    if (!categoria) return false;
    if (["edad", "altura"].includes(categoria)) return !!comparador;
    return opcionValida(categoria, inputTexto);
  };

  const puedeHacerPregunta =
    !juegoTerminado && preguntasRestantes > 0 && entradaPreguntaValida();

  // Aplica la categoría elegida al secreto. No modifica turnos: devuelve si la pregunta es válida
  // y la frase que luego se agrega al historial.
  const obtenerRespuestaPregunta = () => {
    const secreto = jugadorSecreto;
    const cat = categoria;
    const textoInput = inputTexto.trim();

    if (["club", "pais", "posicion", "liga"].includes(cat)) {
      if (!opcionValida(cat, textoInput)) {
        return { valido: false, respuesta: `Selecciona un/a ${cat} válido/a.` };
      }

      const textoLimpio = limpiarTexto(textoInput);

      if (cat === "club") {
        if (periodo === "actual") {
          return {
            valido: true,
            respuesta:
              textoLimpio === limpiarTexto(secreto.clubActual)
                ? `Sí, actualmente juega en ${secreto.clubActual}.`
                : `No, actualmente no juega en ${textoInput}.`,
          };
        } else {
          return {
            valido: true,
            respuesta: secreto.clubesPasados
              .map(limpiarTexto)
              .includes(textoLimpio)
              ? `Sí, en el pasado jugó en ${textoInput}.`
              : `No, en el pasado no jugó en ${textoInput}.`,
          };
        }
      }

      if (cat === "liga") {
        // La liga consultada es la actual; los registros sin club también son una respuesta válida.
        const ligaActual = secreto.ligaActual;
        const esRetirado = ["retiradosinclub", "sinclub", "retirado"].includes(
          limpiarTexto(ligaActual).replace(/\s/g, "")
        );
        return {
          valido: true,
          respuesta:
            textoLimpio === limpiarTexto(ligaActual)
              ? esRetirado
                ? "Sí, está retirado o actualmente no tiene club."
                : `Sí, su club compite en ${ligaActual}.`
              : `No, su club no compite en ${textoInput}.`,
        };
      }

      if (cat === "posicion") {
        const posicionesDelJugador =
          String(secreto.posicion || "").match(/\d+/g) || [];
        const juegaEnLaPosicion = posicionesDelJugador.includes(
          limpiarTexto(textoInput)
        );
        return {
          valido: true,
          respuesta: juegaEnLaPosicion
            ? `Sí, juega como ${textoInput}.`
            : `No, no juega como ${textoInput}.`,
        };
      }

      const valorSecreto = limpiarTexto(secreto[cat]);
      return {
        valido: true,
        respuesta:
          textoLimpio === valorSecreto
            ? `Sí, es de/juega como ${secreto[cat]}.`
            : `No, no es de/juega como ${textoInput}.`,
      };
    }

    const valorReal = secreto[cat];
    const unidad = cat === "edad" ? "años" : "cm";

    if (valorReal === 0) {
      return { valido: true, respuesta: `No hay datos de ${cat}.` };
    }

    let seCumple = false;
    if (comparador === "mayor") seCumple = valorReal > valorRango;
    if (comparador === "menor") seCumple = valorReal < valorRango;
    if (comparador === "exactamente") seCumple = valorReal === valorRango;

    return {
      valido: true,
      respuesta: seCumple
        ? `Sí, su ${cat} es ${comparador} a ${valorRango} ${unidad}.`
        : `No, su ${cat} no es ${comparador} a ${valorRango} ${unidad}.`,
    };
  };

  // El clic en "preguntar" llega acá: solo consume turno si la categoría y la opción son válidas.
  const hacerPregunta = () => {
    if (!jugadorSecreto) return;
    const pregunta = obtenerRespuestaPregunta();
    if (!pregunta.valido) {
      setMensaje(pregunta.respuesta);
    } else {
      const nroPregunta = 11 - preguntasRestantes;
      setRespuestas((prev) => [
        `Pregunta ${nroPregunta}: ${pregunta.respuesta}`,
        ...prev,
      ]);
      setPreguntasRestantes((prev) => prev - 1);
      setMensaje(pregunta.respuesta);
    }
  };

  // El botón de bandera compara el nombre normalizado. Un acierto termina el juego y revela la foto;
  // un error consume un intento y se agrega al historial.
  const intentarAdivinar = () => {
    if (!jugadorSecreto) return;
    const texto = inputAdivinar.trim();

    if (!opcionValida("nombres", texto)) {
      setMensaje("Selecciona un nombre válido de la lista.");
      return;
    }

    if (limpiarTexto(texto) === limpiarTexto(jugadorSecreto.nombre)) {
      setJuegoTerminado(true);
      setMensaje(
        `${comentarioFutbolero("acierto")} Adivinaste: ${jugadorSecreto.nombre}.`
      );
      setRespuestas((prev) => [
        `✅ ACIERTO: ${jugadorSecreto.nombre}`,
        ...prev,
      ]);

    } else {
      setPreguntasRestantes((prev) => Math.max(0, prev - 1));
      setMensaje(`No es ${texto}. Sigue intentando.`);
      setRespuestas((prev) => [`❌ Fallaste: ${texto}`, ...prev]);
    }
  };

  // Activa la pista completa una vez que se presiona el botón de cámara.
  const mostrarPista = () => {
    if (!jugadorSecreto) return;
    setPistaActiva(true);
  };

  // Marca visualmente la respuesta más reciente sin modificar el resultado de la pregunta.
  const marcarRespuesta = () => {
    if (respuestas.length > 0 && !respuestas[0].startsWith("🏁")) {
      setRespuestas((prev) => [`🏁 ${prev[0]}`, ...prev.slice(1)]);
      setMensaje("Respuesta marcada.");
    }
  };

  const reiniciarPartida = () => {
    setPreguntasRestantes(10);
    setCategoria(null);
    setComparador(null);
    setValorRango(180);
    setPeriodo("actual");
    setJuegoTerminado(false);
    setJugadorSecreto(null);
    setRespuestas([]);
    setPistaActiva(false);
    setInputTexto("");
    setInputAdivinar("");
    setMensaje("Selecciona una categoría y haz tu primera pregunta.");
    cargarJugadores();
  };

  const opcionesSugerencias = ["club", "pais", "posicion", "liga"].includes(categoria)
    ? sugerencias[categoria] || []
    : [];
  const preguntasUsadas = 10 - preguntasRestantes;
  const adivino = respuestas.some((respuesta) => respuesta.startsWith("✅ ACIERTO:"));
  const terminoLaPartida = juegoTerminado || preguntasRestantes <= 0;

  // Puente entre la lógica local y el lobby. Payload: preguntas usadas, terminado, si adivinó,
  // respuestas visibles y si usó pista. No se agrega el jugador secreto; el backend además
  // filtra las respuestas que empiecen con el texto de acierto antes de transmitirlas.
  useEffect(() => {
    enviarProgreso({ // Snapshot; no son eventos de cada pregunta ni se envía el jugador secreto.
      preguntasUsadas,
      terminado: terminoLaPartida,
      adivino: terminoLaPartida && adivino,
      respuestas,
      pistaActiva,
    });
    if (terminoLaPartida) marcarPartidaTerminada();
  }, [
    preguntasUsadas,
    respuestas,
    pistaActiva,
    terminoLaPartida,
    adivino,
    modo,
    sala?.status,
    enviarProgreso,
    marcarPartidaTerminada,
  ]);

  return (
    <>
      {terminoLaPartida && adivino && <GoalCelebration />}
      <main id="main">
        <div id="contenedor-jugador-top">
          <div id="contenedor-jugador">
            <PlayerSilhouette
              id="silueta"
              imagen={fotoJugador}
              revelado={adivino}
              size={100}
            />
          </div>
          <div id="dificultad"><DifficultyBadge nivel={3} max={3} /></div>
        </div>

        <QuestionPanel
          categoria={categoria}
          onCategoria={seleccionarCategoria}
          periodo={periodo}
          onPeriodo={setPeriodo}
          comparador={comparador}
          onComparador={seleccionarComparador}
          valor={valorRango}
          onValor={setValorRango}
          texto={inputTexto}
          onTexto={setInputTexto}
          opciones={opcionesSugerencias}
          onPreguntar={hacerPregunta}
          restantes={preguntasRestantes}
          deshabilitado={!puedeHacerPregunta}
        />

        <p id="mensaje-juego" className="mensaje-juego">
          {terminoLaPartida ? "" : mensaje}
        </p>

        <AnswerList
          respuestas={respuestas}
          onMarcar={marcarRespuesta}
          juegoTerminado={terminoLaPartida}
          buttonClassName="btn-accion"
        />

        <GuessBox
          opciones={sugerencias.nombres}
          valor={inputAdivinar}
          onCambio={setInputAdivinar}
          onAdivinar={intentarAdivinar}
          deshabilitado={
            juegoTerminado ||
            preguntasRestantes <= 0 ||
            !opcionValida("nombres", inputAdivinar)
          }
        />

        <ClueBox
          pista={jugadorSecreto
            ? `País: ${jugadorSecreto.pais || "?"} • Club actual: ${jugadorSecreto.clubActual || "?"} • Posición: ${jugadorSecreto.posicion || "?"} • Edad: ${jugadorSecreto.edad || "?"} años • Altura: ${jugadorSecreto.altura || "?"} cm`
            : ""}
          usada={pistaActiva}
          onPedir={mostrarPista}
          deshabilitada={terminoLaPartida}
        />

        {pistaActiva && companerosConImagen.length > 0 && (
          <LinkGallery
            companeros={companerosConImagen}
            revelado={terminoLaPartida}
            jugadorMisterioso={jugadorSecreto?.nombre}
          />
        )}

        {terminoLaPartida && (
          <ResultCard
            gano={adivino}
            titulo={adivino ? "¡Jugador encontrado!" : "Se terminaron las preguntas"}
            detalle={`El jugador era ${jugadorSecreto?.nombre || "desconocido"}.`}
            onReiniciar={reiniciarPartida}
            className="resultadoPartida"
          />
        )}
      </main>
    </>
  );
}

export default function AdivinaElJugadorPage() {
  return (
    <GameLobby game="adivinaeljugador">
      <AdivinaElJugadorGame />
    </GameLobby>
  );
}
