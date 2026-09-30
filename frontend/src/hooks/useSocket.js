import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const DEFAULT_OPTIONS = { withCredentials: false };

// Hook reutilizable: concentra la conexión para que una página solo tenga que
// hacer: const { socket, isConnected } = useSocket();
export default function useSocket(
  serverUrl = "ws://localhost:4000",
  options = DEFAULT_OPTIONS
) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // io() abre el canal con el backend. useRef permite guardar el socket sin
    // provocar otro render de React.
    const socket = io(serverUrl, options);
    socketRef.current = socket;

    // on() escucha eventos que manda el servidor.
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
