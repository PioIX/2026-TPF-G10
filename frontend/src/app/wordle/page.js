// src/app/wordle/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "../global.css";

const API_URL = "http://localhost:4000";
const MAX_INTENTOS = 6;

const COLOR_CORRECTO = "#4caf50";
const COLOR_CERCANO = "#f1c40f";
const COLOR_INCORRECTO = "#7f8c8d";

const FILAS_TECLADO = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BKSP"],
];

function limpiarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export default function WordlePage() {
  const [palabraSecreta, setPalabraSecreta] = useState("");
  const [filas, setFilas] = useState([]); // Matriz [fila][col] con { letra, color }
  const [intentoActual, setIntentoActual] = useState(0);
  const [letraActual, setLetraActual] = useState(0);
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [mensaje, setMensaje] = useState("Cargando juego...");

  // Inicializa el juego pidiendo los jugadores al backend
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

  useEffect(() => {
    iniciarJuego();
  }, [iniciarJuego]);

  // Determina el color de cada celda al validar la fila
  const colorDeLetra = (letra, indice) => {
    if (letra === palabraSecreta[indice]) return COLOR_CORRECTO;
    if (palabraSecreta.includes(letra)) return COLOR_CERCANO;
    return COLOR_INCORRECTO;
  };

  // Escribir una letra en la posición actual
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

  // Borrar la última letra escrita en la fila actual
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

  // Validar el intento cuando se presiona ENTER
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
  }, [juegoTerminado, palabraSecreta, filas, intentoActual]);

  // Manejador central de teclas (tanto físicas como en pantalla)
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

  // Escucha del teclado físico
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

  return (
    <>
      {/* Tu compañero puede reemplazar el header por <Title> */}
      <header>
        <h1>WORDLE - FULBO 11</h1>
        <Link href="/">
          <img src="/img/logo.png" alt="Logo" />
        </Link>
      </header>
      <hr />

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