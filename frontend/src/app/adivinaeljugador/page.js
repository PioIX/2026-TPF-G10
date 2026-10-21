// src/app/adivinaeljugador/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import "../global.css";
import GameLobby, { useGameSession } from "../../components/GameLobby";

const API_URL = "http://localhost:4000";

// Quita tildes y signos para comparar respuestas aunque cambie la escritura.
function limpiarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toLowerCase()
    .trim();
}

// Agrupa las filas de jugadores y arma las opciones para los filtros.
function construirJugadores(datos) {
  const jugadoresMap = new Map();
  const sugerenciasTemp = { club: [], pais: [], posicion: [], nombres: [] };

  datos.forEach((fila) => {
    const id = fila.id_jugador;
    if (!id) return;

    if (!jugadoresMap.has(id)) {
      jugadoresMap.set(id, {
        id,
        nombre: `${fila.nombre || ""} ${fila.apellido || ""}`.trim(),
        pais: fila.pais || fila.country || "",
        posicion: fila.posicion || "",
        edad: Number(fila.edad) || 0,
        altura: Number(fila.altura) || 0,
        trayectoria: [],
      });
    }

    const jugador = jugadoresMap.get(id);
    const club = fila.nombre_equipo || "";

    if (jugador.pais) sugerenciasTemp.pais.push(jugador.pais);
    if (jugador.posicion) sugerenciasTemp.posicion.push(jugador.posicion);
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
    posicion: Array.from(new Set(sugerenciasTemp.posicion)).sort(),
    nombres: Array.from(new Set(sugerenciasTemp.nombres)).sort(),
  };

  const listaJugadores = Array.from(jugadoresMap.values()).map((jugador) => {
    jugador.trayectoria.sort(
      (a, b) => a.ingreso - b.ingreso || a.traspaso - b.traspaso
    );
    jugador.clubes = [...new Set(jugador.trayectoria.map((t) => t.club))];
    jugador.clubActual = jugador.trayectoria.length
      ? jugador.trayectoria[jugador.trayectoria.length - 1].club
      : "";
    jugador.clubesPasados =
      jugador.trayectoria.length > 1
        ? jugador.trayectoria.slice(0, -1).map((t) => t.club)
        : [];
    return jugador;
  });

  return { listaJugadores, sugerenciasLimpias };
}

// Mantiene el juego dentro del lobby para sortear al jugador luego de elegir el modo.
function AdivinaElJugadorGame() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();

  // Cada estado representa datos cargados, selección del jugador o avance de la partida.
  const [jugadores, setJugadores] = useState([]);
  const [sugerencias, setSugerencias] = useState({
    club: [],
    pais: [],
    posicion: [],
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

  // Consulta el backend, prepara las sugerencias y elige el jugador secreto.
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

  useEffect(() => {
    // El microtask inicia la carga después de terminar el efecto de montaje.
    Promise.resolve().then(cargarJugadores);
  }, [cargarJugadores]);

  // Comprueba que una respuesta escrita corresponda a una opción conocida.
  const opcionValida = (cat, texto) => {
    if (!texto) return false;
    const opciones = sugerencias[cat] || [];
    return opciones.some(
      (opcion) => limpiarTexto(opcion) === limpiarTexto(texto)
    );
  };

  const seleccionarCategoria = (cat) => {
    setCategoria(cat);
    setComparador(null);
    setMensaje(`Categoría actual: ${cat.toUpperCase()}.`);

    // Ajustar el rango por defecto según si eligió edad o altura
    if (cat === "edad" && (valorRango < 16 || valorRango > 45)) {
      setValorRango(25);
    } else if (cat === "altura" && (valorRango < 150 || valorRango > 210)) {
      setValorRango(180);
    }
  };

  const seleccionarComparador = (comp) => {
    if (!categoria) {
      setMensaje("Primero elige una categoría.");
    } else {
      setComparador(comp);
    }
  };

  const entradaPreguntaValida = () => {
    if (!categoria) return false;
    if (["edad", "altura"].includes(categoria)) return !!comparador;
    return opcionValida(categoria, inputTexto);
  };

  const puedeHacerPregunta =
    !juegoTerminado && preguntasRestantes > 0 && entradaPreguntaValida();

  const obtenerRespuestaPregunta = () => {
    const secreto = jugadorSecreto;
    const cat = categoria;
    const textoInput = inputTexto.trim();

    if (["club", "pais", "posicion"].includes(cat)) {
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

  const intentarAdivinar = async () => {
    if (!jugadorSecreto) return;
    const texto = inputAdivinar.trim();

    if (!opcionValida("nombres", texto)) {
      setMensaje("Selecciona un nombre válido de la lista.");
      return;
    }

    if (limpiarTexto(texto) === limpiarTexto(jugadorSecreto.nombre)) {
      setJuegoTerminado(true);
      setMensaje(`¡Adivinaste! El jugador es ${jugadorSecreto.nombre}.`);
      setRespuestas((prev) => [
        `✅ ACIERTO: ${jugadorSecreto.nombre}`,
        ...prev,
      ]);

      // Buscar foto en TheSportsDB
      try {
        const res = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(
            jugadorSecreto.nombre
          )}`
        );
        const data = await res.json();
        if (data?.player?.[0]) {
          const img = data.player[0].strCutout || data.player[0].strThumb || "";
          setFotoJugador(img);
        }
      } catch (err) {
        console.error("Error buscando foto del jugador:", err);
      }
    } else {
      setPreguntasRestantes((prev) => Math.max(0, prev - 1));
      setMensaje(`No es ${texto}. Sigue intentando.`);
      setRespuestas((prev) => [`❌ Fallaste: ${texto}`, ...prev]);
    }
  };

  const mostrarPista = () => {
    if (!jugadorSecreto) return;
    setPistaActiva(true);
  };

  const marcarRespuesta = () => {
    if (respuestas.length > 0 && !respuestas[0].startsWith("🏁")) {
      setRespuestas((prev) => [`🏁 ${prev[0]}`, ...prev.slice(1)]);
      setMensaje("Respuesta marcada.");
    }
  };

  const esEdad = categoria === "edad";
  const catTexto = ["club", "pais", "posicion"].includes(categoria);
  const opcionesSugerencias = catTexto ? sugerencias[categoria] || [] : [];
  const preguntasUsadas = 10 - preguntasRestantes;
  const adivino = respuestas.some((respuesta) => respuesta.startsWith("✅ ACIERTO:"));
  const terminoLaPartida = juegoTerminado || preguntasRestantes <= 0;

  // Comparte preguntas, fallos y uso de pista; el backend excluye el acierto con el nombre secreto.
  useEffect(() => {
    enviarProgreso({
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
      <main id="main">
        <div id="contenedor-jugador-top">
          <div id="contenedor-jugador">
            <div id="silueta">
              {fotoJugador ? (
                <Image
                  id="fotoJugador"
                  src={fotoJugador}
                  alt={jugadorSecreto?.nombre}
                  width={240}
                  height={240}
                  unoptimized
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                "?"
              )}
            </div>
          </div>
          <div id="dificultad">⚽⚽⚽</div>
        </div>

        <div id="caja-preguntas">
          <p id="titulo-preguntas">Haz preguntas haciendo clic abajo:</p>

          <div className="fila-botones">
            <div id="grupo-botones-1">
              <button
                id="actual"
                type="button"
                className={`btn-pill ${periodo === "actual" ? "selected" : ""}`}
                onClick={() => setPeriodo("actual")}
              >
                Actual
              </button>
              <button
                id="pasado"
                type="button"
                className={`btn-pill ${periodo === "pasado" ? "selected" : ""}`}
                onClick={() => setPeriodo("pasado")}
              >
                Pasado
              </button>
            </div>
          </div>

          <div className="fila-botones">
            <div id="grupo-botones-2">
              {[
                { id: "club", label: "Club" },
                { id: "pais", label: "País" },
                { id: "posicion", label: "Posición" },
                { id: "edad", label: "Edad" },
                { id: "altura", label: "Altura" },
              ].map((boton) => (
                <button
                  key={boton.id}
                  id={boton.id}
                  type="button"
                  className={`btn-pill ${
                    categoria === boton.id ? "selected" : ""
                  }`}
                  onClick={() => seleccionarCategoria(boton.id)}
                >
                  {boton.label}
                </button>
              ))}
            </div>
          </div>

          <div
            id="comparador"
            className={!["edad", "altura"].includes(categoria) ? "hidden" : ""}
          >
            <div className="fila-botones">
              {[
                { id: "mayor", label: "Mayor que" },
                { id: "menor", label: "Menor que" },
                { id: "exactamente", label: "Exactamente" },
              ].map((comp) => (
                <button
                  key={comp.id}
                  id={comp.id}
                  type="button"
                  className={`btn-pill ${
                    comparador === comp.id ? "selected" : ""
                  }`}
                  onClick={() => seleccionarComparador(comp.id)}
                >
                  {comp.label}
                </button>
              ))}
            </div>

            <div id="slider-contenedor">
              <input
                type="range"
                id="input-rango"
                min={esEdad ? 16 : 150}
                max={esEdad ? 45 : 210}
                value={valorRango}
                onChange={(e) => setValorRango(Number(e.target.value))}
              />
              <span id="valor-rango">
                {valorRango} {esEdad ? "años" : "cm"}
              </span>
            </div>
          </div>

          <div className="fila-input-preguntar">
            <input
              type="text"
              id="input-texto"
              className="input-pill"
              list="sugerencias"
              disabled={!catTexto}
              placeholder={
                catTexto
                  ? "Selecciona o escribe aquí"
                  : categoria
                  ? "Usa el slider numérico"
                  : "Elige una categoría"
              }
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
            />
            <datalist id="sugerencias">
              {opcionesSugerencias.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>

            {/* Tu compañero puede reemplazar este botón por su componente <Button> */}
            <button
              id="btn-preguntar"
              type="button"
              className="btn-accion"
              disabled={!puedeHacerPregunta}
              onClick={hacerPregunta}
            >
              Hacer pregunta
            </button>
          </div>
        </div>

        <p id="preguntas-restantes">
          Tienes {preguntasRestantes} preguntas restantes:
        </p>
        <p id="mensaje-juego" className="mensaje-juego">
          {mensaje}
        </p>

        <div id="caja-respuestas">
          {respuestas.slice(0, 10).map((t, index) => (
            <div key={index} className="respuesta">
              {t}
            </div>
          ))}
        </div>

        <div id="caja-adivinar">
          <input
            type="text"
            id="input-adivinar"
            className="input-pill"
            list="sugerencias-adivinar"
            placeholder="Escribe el nombre del futbolista"
            value={inputAdivinar}
            onChange={(e) => setInputAdivinar(e.target.value)}
          />
          <datalist id="sugerencias-adivinar">
            {sugerencias.nombres.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <button
            id="btn-adivinar"
            type="button"
            className="btn-icono"
            disabled={
              juegoTerminado ||
              preguntasRestantes <= 0 ||
              !opcionValida("nombres", inputAdivinar)
            }
            onClick={intentarAdivinar}
          >
            🚩
          </button>
        </div>

        <div id="pista" className={`pista ${pistaActiva ? "visible" : ""}`}>
          {pistaActiva && jugadorSecreto
            ? `País: ${jugadorSecreto.pais || "?"} • Club Act: ${
                jugadorSecreto.clubActual || "?"
              } • Posición: ${jugadorSecreto.posicion || "?"} • Edad: ${
                jugadorSecreto.edad || "?"
              } años • Altura: ${jugadorSecreto.altura || "?"} cm`
            : "Pulsa el icono de cámara para mostrar una pista."}
        </div>

        <div id="botones-inferiores">
          <button
            id="btn-marcar"
            type="button"
            className="btn-accion"
            disabled={juegoTerminado || respuestas.length === 0}
            onClick={marcarRespuesta}
          >
            🚩 Marcar respuesta
          </button>
          <button
            id="btn-camara"
            type="button"
            className="btn-icono"
            disabled={juegoTerminado}
            onClick={mostrarPista}
          >
            📸
          </button>
        </div>
      </main>
    </>
  );
}

// Ofrece jugar solo o mediante código antes de cargar el jugador secreto.
export default function AdivinaElJugadorPage() {
  return (
    <GameLobby game="adivinaeljugador">
      <AdivinaElJugadorGame />
    </GameLobby>
  );
}
