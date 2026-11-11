import { useEffect, useRef } from "react";
import { BACKEND_URL } from "../config/backend";

// Guarda el resultado de una partida una sola vez cuando termina.
// Registra en el backend una única fila de resultado cuando el juego cambia a terminado.
export default function useRegistrarResultado(juego, terminado, gano, puntaje = 0) {
  const yaRegistrado = useRef(false);

  useEffect(() => {
    if (!terminado) {
      yaRegistrado.current = false;
      return;
    }
    if (yaRegistrado.current) return;
    yaRegistrado.current = true;

    const idUsuario = Number(window.localStorage.getItem("usuarioId"));
    if (!idUsuario) return;

    fetch(`${BACKEND_URL}/partidas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_usuario: idUsuario, juego, gano: Boolean(gano), puntaje }),
    }).catch((error) => console.error("No se pudo guardar el resultado de la partida:", error));
  }, [terminado, gano, juego, puntaje]);
}
