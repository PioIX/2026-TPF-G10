// Uso: panel lateral de /menu para conversar entre usuarios que iniciaron sesión.
// Socket.IO entrega mensajes en tiempo real; el backend revisa el usuario y limita los mensajes.
"use client";

import { useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";

// El menú es el único lugar que monta este panel, pero el servidor no liga chat:global a una ruta.
// Este hook crea un socket separado del de GameLobby; al salir del menú, el disconnect lo saca del canal.
/*
 * Flujo de eventos:
 * 1. Cuando ya hay socket conectado, escuchamos `chat-messages` y `newMessage`.
 * 2. Emitimos `joinGlobalChat` sin payload. El backend valida el perfil, agrega el socket
 *    a `chat:global` y devuelve el historial reciente mediante `chat-messages`.
 * 3. Al enviar, emitimos `sendMessage` con { message: texto }.
 * 4. El callback de confirmación responde solo al emisor. Si acepta, limpiamos el input;
 *    los miembros del canal reciben además `newMessage` por broadcast de sala.
 *
 * No usamos `pingAll`: el chat tiene una sala lógica exclusiva llamada `chat:global`.
 * Es global entre quienes se unan, aunque visualmente el panel esté en el menú.
 */
export default function GlobalChat() {
  const { socket, isConnected } = useSocket();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");

  // Es importante registrar los .on antes de emitir joinGlobalChat: el backend envía
  // chat-messages inmediatamente dentro del handler de unión, y si escucháramos después
  // podríamos perder el historial inicial.
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Evento entrante `chat-messages`: { user, room, messages }.
    // Reemplaza la lista local con los últimos mensajes que mantiene el servidor en memoria.
    const recibirHistorial = (datos) => setMensajes(datos.messages || []);
    // Evento entrante `newMessage`: { room, message }. Agrega el mensaje a la lista visual.
    // El servidor también limita su historial a 50; el slice mantiene acotada esta vista.
    const recibirMensaje = (datos) => {
      setMensajes((anteriores) => [...anteriores, datos.message].slice(-50));
    };

    socket.on("chat-messages", recibirHistorial); // Mensaje inicial con el historial al entrar.
    socket.on("newMessage", recibirMensaje); // Cada mensaje nuevo que el backend emite al canal.
    // Evento saliente `joinGlobalChat`: no requiere datos; la identidad viajó en el handshake.
    socket.emit("joinGlobalChat", (respuesta) => { // Se une a chat:global; ACK privado de aceptación.
      if (!respuesta.ok) setError(respuesta.error);
    });

    return () => {
      socket.off("chat-messages", recibirHistorial);
      socket.off("newMessage", recibirMensaje);
      // Este cleanup solo quita listeners. Si la conexión cae, Socket.IO sale de la sala;
      // si el componente se desmonta, useSocket cierra el socket.
    };
  // Si el transporte se reconecta, isConnected vuelve a true, este efecto se registra otra vez
  // y emite joinGlobalChat de nuevo; el chat sí vuelve a unirse automáticamente a su sala.
  }, [socket, isConnected]);

  // Evento saliente `sendMessage`: { message }. El servidor recorta/valida longitud,
  // membresía del canal y ritmo de envío. El callback es una confirmación privada;
  // el evento newMessage es lo que actualiza los paneles de todos los participantes.
  const enviarMensaje = (evento) => {
    evento.preventDefault();
    if (!texto.trim() || !socket) return;

    socket.emit("sendMessage", { message: texto }, (respuesta) => { // ACK solo para decidir si limpiar/error.
      if (respuesta.ok) {
        // No agregamos el mensaje acá: el backend también emite newMessage a esta sala,
        // y ese listener lo agrega una sola vez tanto al emisor como a los demás.
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
