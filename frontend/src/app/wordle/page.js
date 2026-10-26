// src/app/wordle/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import "../global.css";
import GameLobby, { useGameSession } from "../../components/GameLobby";
import { BACKEND_URL } from "../../config/backend";

const API_URL = BACKEND_URL;
const MAX_INTENTOS = 6;

// Colores acordados con el tablero rival y con la validación del backend.
const COLOR_CORRECTO = "#4caf50";
const COLOR_CERCANO = "#f1c40f";
const COLOR_INCORRECTO = "#7f8c8d";

const FILAS_TECLADO = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BKSP"],
];

// Convierte el apellido en la palabra que se juega: solo letras A-Z, sin tildes.
function limpiarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

// Uso: contenido del lobby de Wordle. Cada jugador recibe una palabra secreta sorteada por separado.
function WordleGame() {
  const { modo, sala, enviarProgreso, marcarPartidaTerminada } = useGameSession();

  // El estado contiene la palabra secreta, el tablero y el avance del intento.
  const [palabraSecreta, setPalabraSecreta] = useState("");
  const [filas, setFilas] = useState([]); // Matriz [fila][col] con { letra, color }
  const [intentoActual, setIntentoActual] = useState(0);
  const [letraActual, setLetraActual] = useState(0);
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [mensaje, setMensaje] = useState("Cargando juego...");

  // Pide jugadores al backend, descarta apellidos que no entren en el tablero y sortea uno.
  const iniciarJuego = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/jugadores`);
      const datos = await respuesta.json();

      const jugadoresValidos = datos.filter((jugador) => {
        const apellido = limpiarTexto(jugador.apellido || "");
        return apellido.length >= 3 && apellido.length <= 8;
      });

      if (jugadoresValidos.length === 0) {
        setMensaje("No hay jugadores para jugar");
        return;
      }

      const jugador =
        jugadoresValidos[Math.floor(Math.random() * jugadoresValidos.length)];
      const secreta = limpiarTexto(jugador.apellido || "");

      setPalabraSecreta(secreta);
      setIntentoActual(0);
      setLetraActual(0);
      setJuegoTerminado(false);
      setMensaje("Adivina el apellido");

      // Creamos las 6 filas vacías con "_"
      const nuevoTablero = Array.from({ length: MAX_INTENTOS }, () =>
        Array.from({ length: secreta.length }, () => ({
          letra: "_",
          color: "transparent",
        }))
      );
      setFilas(nuevoTablero);
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo cargar el juego");
    }
  }, []);

  // Carga inicial después del montaje del componente cliente.
  useEffect(() => {
    Promise.resolve().then(iniciarJuego);
  }, [iniciarJuego]);

  // Regla de colores del Wordle: letra en lugar correcto, en otra posición o ausente.
  const colorDeLetra = useCallback((letra, indice) => {
    if (letra === palabraSecreta[indice]) return COLOR_CORRECTO;
    if (palabraSecreta.includes(letra)) return COLOR_CERCANO;
    return COLOR_INCORRECTO;
  }, [palabraSecreta]);

  // Actualiza una copia de la matriz para que React detecte el cambio y vuelva a dibujar el tablero.
  const escribirLetra = useCallback(
    (letra) => {
      if (juegoTerminado || !palabraSecreta) return;
      if (letraActual >= palabraSecreta.length) return;

      setFilas((prevFilas) => {
        const copia = prevFilas.map((fila) => [...fila]);
        if (copia[intentoActual][letraActual].letra === "_") {
          copia[intentoActual][letraActual] = {
            ...copia[intentoActual][letraActual],
            letra,
          };
        }
        return copia;
      });
      setLetraActual((prev) => prev + 1);
    },
    [juegoTerminado, palabraSecreta, letraActual, intentoActual]
  );

  // Reemplaza la última letra por _ y retrocede el cursor dentro del intento.
  const borrarLetra = useCallback(() => {
    if (juegoTerminado || letraActual === 0) return;

    const indiceABorrar = letraActual - 1;
    setFilas((prevFilas) => {
      const copia = prevFilas.map((fila) => [...fila]);
      copia[intentoActual][indiceABorrar] = {
        ...copia[intentoActual][indiceABorrar],
        letra: "_",
      };
      return copia;
    });
    setLetraActual(indiceABorrar);
  }, [juegoTerminado, letraActual, intentoActual]);

  // Comprueba que la fila esté completa, colorea letras y avanza o finaliza la partida.
  const revisarIntento = useCallback(() => {
    if (juegoTerminado || !palabraSecreta || filas.length === 0) return;

    const filaActual = filas[intentoActual];
    const intento = filaActual
      .map((celda) => celda.letra)
      .join("")
      .replace(/_/g, "");

    if (intento.length !== palabraSecreta.length) {
      setMensaje("Faltan letras");
      return;
    }

    // Coloreamos las letras de la fila actual
    setFilas((prevFilas) => {
      const copia = prevFilas.map((fila) => [...fila]);
      copia[intentoActual] = copia[intentoActual].map((celda, i) => ({
        ...celda,
        color: colorDeLetra(intento[i], i),
      }));
      return copia;
    });

    if (intento === palabraSecreta) {
      setJuegoTerminado(true);
      setMensaje("¡Ganaste!");
      return;
    }

    const siguienteIntento = intentoActual + 1;
    setIntentoActual(siguienteIntento);
    setLetraActual(0);

    if (siguienteIntento >= MAX_INTENTOS) {
      setJuegoTerminado(true);
      setMensaje(`Perdiste. La palabra era ${palabraSecreta}`);
    }
  }, [juegoTerminado, palabraSecreta, filas, intentoActual, colorDeLetra]);

  // Unifica el teclado físico y el teclado dibujado en pantalla en las mismas tres acciones.
  const manejarTecla = useCallback(
    (tecla) => {
      if (tecla === "ENTER") {
        revisarIntento();
        return;
      }
      if (tecla === "BKSP") {
        borrarLetra();
        return;
      }
      if (/^[A-Z]$/.test(tecla)) {
        escribirLetra(tecla);
      }
    },
    [revisarIntento, borrarLetra, escribirLetra]
  );

  // Efecto de teclado global; la función de limpieza quita el listener al salir de la ruta.
  useEffect(() => {
    const handleKeyDown = (evento) => {
      const tecla = evento.key.toUpperCase();
      if (tecla === "BACKSPACE" || tecla === "DELETE") {
        manejarTecla("BKSP");
        return;
      }
      if (tecla === "ENTER") {
        manejarTecla("ENTER");
        return;
      }
      if (/^[A-Z]$/.test(tecla)) {
        manejarTecla(tecla);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [manejarTecla]);

  // Cuenta los intentos coloreados y prepara el resultado público del Wordle.
  const intentosUsados = filas.filter((fila) =>
    fila.some((celda) => celda.color !== "transparent")
  ).length;
  const gano = juegoTerminado && mensaje === "¡Ganaste!";

  // Publica letras y colores ya revelados; nunca incluye palabraSecreta en el mensaje online.
  useEffect(() => {
    enviarProgreso({
      intentosUsados,
      terminado: juegoTerminado,
      gano,
      tablero: filas,
    });
    if (juegoTerminado) marcarPartidaTerminada();
  }, [
    intentosUsados,
    filas,
    juegoTerminado,
    gano,
    modo,
    sala?.status,
    enviarProgreso,
    marcarPartidaTerminada,
  ]);

  return (
    <>
      <main className="wordle-main">
        <div id="mensaje">{mensaje}</div>

        {/* Tablero generado por estado */}
        <div id="tablero" className="tablero">
          {filas.map((fila, iFila) => (
            <div key={iFila} className="fila">
              {fila.map((celda, iCol) => (
                <div
                  key={iCol}
                  className="letra"
                  style={{ background: celda.color }}
                >
                  {celda.letra}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Teclado en pantalla */}
        <div id="teclado">
          {FILAS_TECLADO.map((filaTeclas, idx) => (
            <div key={idx} className="fila-teclado">
              {filaTeclas.map((tecla) => (
                <button
                  key={tecla}
                  type="button"
                  className={`tecla ${
                    tecla === "ENTER" || tecla === "BKSP" ? "grande" : ""
                  }`}
                  onClick={() => manejarTecla(tecla)}
                >
                  {tecla}
                </button>
              ))}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

// Ruta /wordle: el lobby elige modo y mantiene viva la misma instancia del minijuego.
export default function WordlePage() {
  return (
    <GameLobby game="wordle">
      <WordleGame />
    </GameLobby>
  );
}
