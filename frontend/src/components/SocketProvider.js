"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/**
 * Mantiene una sola conexión Socket.IO para toda la aplicación.
 * Así, el socket sobrevive a la navegación entre el menú y los minijuegos.
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // withCredentials permite enviar la cookie de sesión al backend en otro puerto.
    const conexion = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    });

    const alConectar = () => setIsConnected(true);
    const alDesconectar = () => setIsConnected(false);

    conexion.on("connect", alConectar);
    conexion.on("disconnect", alDesconectar);
    setSocket(conexion);
    conexion.connect();

    // Cierra la conexión compartida al desmontar el proveedor.
    return () => {
      conexion.off("connect", alConectar);
      conexion.off("disconnect", alDesconectar);
      conexion.disconnect();
    };
  }, []);

  const valor = useMemo(
    () => ({ socket, isConnected }),
    [socket, isConnected]
  );

  return (
    <SocketContext.Provider value={valor}>{children}</SocketContext.Provider>
  );
}

/** Devuelve la conexión compartida y su estado actual. */
export function useSocket() {
  const contexto = useContext(SocketContext);
  if (!contexto) {
    throw new Error("useSocket debe usarse dentro de SocketProvider.");
  }
  return contexto;
}
