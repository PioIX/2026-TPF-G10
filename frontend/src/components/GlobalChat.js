// Uso: panel lateral de /menu para conversar entre usuarios que iniciaron sesión.
// Socket.IO entrega mensajes en tiempo real; el backend revisa el usuario y limita los mensajes.
"use client";

import { useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";

// Uso: panel lateral de /menu. Socket.IO comparte historial y mensajes; el backend valida el usuario.
/*
 * Al conectarse, el chat emite joinGlobalChat y recibe chat-messages con el historial reciente.
 * Después agrega cada newMessage entrante. Al enviar, sendMessage devuelve una confirmación:
 * solo si el backend la acepta se limpia el campo de texto.
 */
export default function GlobalChat() {
  const { socket, isConnected } = useSocket();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");

  // Se une al canal global y escucha el historial y los mensajes nuevos.
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Reemplaza el listado local por los últimos mensajes que envía el backend al unirse.
    const recibirHistorial = (datos) => setMensajes(datos.messages || []);
    // Agrega el mensaje nuevo y limita la vista a los últimos 50 elementos.
    const recibirMensaje = (datos) => {
      setMensajes((anteriores) => [...anteriores, datos.message].slice(-50));
    };

    socket.on("chat-messages", recibirHistorial);
    socket.on("newMessage", recibirMensaje);
    socket.emit("joinGlobalChat", (respuesta) => {
      if (!respuesta.ok) setError(respuesta.error);
    });

    return () => {
      socket.off("chat-messages", recibirHistorial);
      socket.off("newMessage", recibirMensaje);
    };
  }, [socket, isConnected]);

  // Envía el texto al backend y limpia el campo solo si el servidor lo acepta.
  // La respuesta del callback también permite mostrar las validaciones del servidor.
  const enviarMensaje = (evento) => {
    evento.preventDefault();
    if (!texto.trim() || !socket) return;

    socket.emit("sendMessage", { message: texto }, (respuesta) => {
      if (respuesta.ok) {
        setTexto("");
        setError("");
      } else {
        setError(respuesta.error);
      }
    });
  };

  return (
    <aside className="chat-global" aria-label="Chat global">
      <h2>Chat global</h2>
      <p>{isConnected ? "Conectado" : "Conectando..."}</p>

      <div className="chat-mensajes" aria-live="polite">
        {mensajes.map((mensaje) => (
          <p key={mensaje.id}>
            <strong>{mensaje.user?.name || "Jugador"}: </strong>
            {mensaje.message}
          </p>
        ))}
      </div>

      <form onSubmit={enviarMensaje}>
        <label className="sr-only" htmlFor="mensaje-global">Mensaje</label>
        <input
          id="mensaje-global"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          maxLength={500}
          placeholder="Escribí un mensaje"
          disabled={!isConnected}
        />
        <button type="submit" disabled={!isConnected || !texto.trim()}>
          Enviar
        </button>
      </form>

      {error && <p role="status">{error}</p>}
    </aside>
  );
}
