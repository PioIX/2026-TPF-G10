import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../config/backend";

const DEFAULT_OPTIONS = {};

/*
 * Hook reutilizable para abrir una conexión Socket.IO desde un componente cliente.
 * La conexión empieza en el useEffect de abajo, después de montar el componente en el navegador.
 * No es una conexión directa a otro jugador: cada navegador conecta con el backend y el backend releva.
 * Socket.IO gestiona el transporte/reintentos; este código no fuerza `transports: ["websocket"]`.
 *
 * Se usa en GameLobby, GlobalChat y Administración. Cada uso crea su propia conexión;
 * no hay un único socket global compartido por todas las rutas.
 */
export default function useSocket(
  serverUrl = BACKEND_URL,
  options = DEFAULT_OPTIONS
) {
  // Estado React para que la interfaz pueda mostrar "Conectado" y habilitar botones.
  const [isConnected, setIsConnected] = useState(false);
  // El objeto socket es mutable; guardarlo en ref no renderiza por sí solo.
  const socketRef = useRef(null);

  useEffect(() => {
    // Este efecto se ejecuta al montar y se limpia al desmontar o si cambia serverUrl/options.
    // Mientras el componente siga montado, Socket.IO puede reintentar una conexión caída.
    // localStorage solo existe en el navegador, por eso se lee dentro de useEffect.
    // Este ID no es el socket.id: usuarioId identifica la cuenta; socket.id identifica
    // esta conexión concreta y puede cambiar si se vuelve a conectar.
    const userId = window.localStorage.getItem("usuarioId");

    // io() inicia el cliente Socket.IO contra el servidor configurado.
    // `query.userId` viaja en el handshake inicial; el backend lo usa para buscar
    // el perfil público y guardarlo en socket.data.user.
    const socket = io(serverUrl, {
      ...options,
      query: { ...options.query, userId },
    });
    socketRef.current = socket;

    // Este hook escucha SOLO el estado de la conexión. Los eventos de sala se escuchan
    // en GameLobby y los del chat en GlobalChat. `connect` también hace renderizar al padre:
    // antes de eso, socketRef.current ya tiene valor pero React todavía no se enteró del ref.
    const alConectar = () => {
      setIsConnected(true);
      console.log("WebSocket conectado");
    };

    const alDesconectar = () => {
      setIsConnected(false);
      console.log("WebSocket desconectado");
    };

    socket.on("connect", alConectar); // Este hook escucha conexión; GameLobby/GlobalChat escuchan sus eventos propios.
    socket.on("disconnect", alDesconectar); // setIsConnected(false) hace que la UI refleje la caída.

    // Cleanup real del vínculo: primero quita los dos listeners propios y luego cierra el socket.
    // El servidor recibirá `disconnect`; si esta conexión estaba en una sala, el backend la libera.
    return () => {
      socket.off("connect", alConectar);
      socket.off("disconnect", alDesconectar);
      socket.disconnect(); // Cierra el vínculo con el servidor; el backend recibe su evento disconnect.
      socketRef.current = null;
    };
    // Si cambia la URL/opciones, React limpia la conexión anterior y crea otra.
  }, [serverUrl, options]);

  // En el primer render `socket` puede ser null. Tras el evento connect, setIsConnected causa
  // otro render y el componente consumidor ya recibe socketRef.current.
  return { socket: socketRef.current, isConnected };
}
