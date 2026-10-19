"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./SocketProvider";

function nombreDelUsuario(usuario) {
  return usuario && (usuario.name || usuario.nombre || "Jugador");
}

/** Chat global del menú. El backend decide si la sesión tiene permiso para entrar. */
export default function GlobalChat() {
  const { socket } = useSocket();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("Conectando al chat...");
  const [unido, setUnido] = useState(false);

  useEffect(() => {
    if (!socket) return undefined;

    const recibirHistorial = (datos) => {
      setMensajes(Array.isArray(datos.messages) ? datos.messages : []);
      setEstado("Chat global");
      setUnido(true);
    };

    const recibirMensaje = (datos) => {
      if (!datos || !datos.message) return;
      setMensajes((actuales) => {
        if (actuales.some((mensaje) => mensaje.id === datos.message.id)) {
          return actuales;
        }
        return [...actuales, datos.message].slice(-50);
      });
    };

    const entrarAlChat = () => {
      socket.emit("joinGlobalChat", (respuesta) => {
        if (respuesta && !respuesta.ok) {
          setUnido(false);
          setEstado(respuesta.error || "No se pudo ingresar al chat.");
        }
      });
    };

    const alDesconectar = () => {
      setUnido(false);
      setEstado("Se perdió la conexión con el chat.");
    };

    socket.on("chat-messages", recibirHistorial);
    socket.on("newMessage", recibirMensaje);
    socket.on("connect", entrarAlChat);
    socket.on("disconnect", alDesconectar);

    // Si el componente aparece después de la conexión, entra sin esperar otro evento.
    if (socket.connected) entrarAlChat();

    return () => {
      socket.off("chat-messages", recibirHistorial);
      socket.off("newMessage", recibirMensaje);
      socket.off("connect", entrarAlChat);
      socket.off("disconnect", alDesconectar);
      socket.emit("leaveGlobalChat");
    };
  }, [socket]);

  const enviarMensaje = (evento) => {
    evento.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || !unido || !socket) return;

    socket.emit("sendMessage", { message: mensaje }, (respuesta) => {
      if (!respuesta || !respuesta.ok) {
        setEstado((respuesta && respuesta.error) || "No se pudo enviar el mensaje.");
        return;
      }
      setTexto("");
      setEstado("Chat global");
    });
  };

  return (
    <aside className="chatGlobal">
      <h2>Chat global</h2>
      <p className="chatGlobalEstado" role="status">{estado}</p>
      <div className="chatGlobalMensajes" aria-live="polite">
        {mensajes.map((mensaje) => (
          <article className="chatGlobalMensaje" key={mensaje.id}>
            <strong>{nombreDelUsuario(mensaje.user)}</strong>
            <p>{mensaje.message}</p>
            <time dateTime={mensaje.createdAt}>
              {new Date(mensaje.createdAt).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </article>
        ))}
      </div>
      <form className="chatGlobalFormulario" onSubmit={enviarMensaje}>
        <label className="srOnly" htmlFor="mensajeGlobal">Escribí un mensaje</label>
        <input
          id="mensajeGlobal"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          maxLength={500}
          placeholder={unido ? "Escribí un mensaje" : "Iniciá sesión para escribir"}
          disabled={!unido}
        />
        <button type="submit" disabled={!unido || !texto.trim()}>
          Enviar
        </button>
      </form>
    </aside>
  );
}
