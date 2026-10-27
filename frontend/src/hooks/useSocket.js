import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../config/backend";

const DEFAULT_OPTIONS = {};

// Hook reutilizable: concentra la conexión para que una página solo tenga que
// hacer: const { socket, isConnected } = useSocket(). La conexión comparte el ID del usuario
// guardado al iniciar sesión; el backend lo resuelve a un perfil público en el handshake.
export default function useSocket(
  serverUrl = BACKEND_URL,
  options = DEFAULT_OPTIONS
) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // io() abre el canal con el backend. useRef permite guardar el socket sin
    // provocar otro render de React.
    const userId = window.localStorage.getItem("usuarioId");
    const socket = io(serverUrl, {
      ...options,
      query: { ...options.query, userId },
    });
    socketRef.current = socket;

    // connect/disconnect mantienen el indicador de conexión que usan los lobbies y el chat.
    const alConectar = () => {
      setIsConnected(true);
      console.log("WebSocket conectado");
    };

    const alDesconectar = () => {
      setIsConnected(false);
      console.log("WebSocket desconectado");
    };

    socket.on("connect", alConectar);
    socket.on("disconnect", alDesconectar);

    // Cleanup: no dejamos listeners ni una conexión abierta al salir de la página.
    return () => {
      socket.off("connect", alConectar);
      socket.off("disconnect", alDesconectar);
      socket.disconnect();
      socketRef.current = null;
    };
    // En este proyecto los valores son constantes. Si se cambian, se reconecta.
  }, [serverUrl, options]);

  return { socket: socketRef.current, isConnected };
}
