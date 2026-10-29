/*
 * Lo menos obvio de este componente es su ciclo de vida:
 * - GameLobby se monta al entrar a la ruta y abre el socket desde useSocket.
 * - El minijuego llega como `children`, pero el selector no lo incluye en su return;
 *   por eso el componente del juego todavía no se monta ni puede leer el contexto.
 * - Al pasar `fase` a "jugando", React vuelve a dibujar GameLobby. Esta vez children queda
 *   debajo del Provider y recién ahí el minijuego se monta y puede usar useGameSession.
 * - Cambiar fase no navega ni desmonta GameLobby: su estado y su conexión siguen vivos.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSocket from "../hooks/useSocket";
import OpponentProgress from "./OpponentProgress";
import { BACKEND_URL } from "../config/backend";

// Comunicación interna de React, no un evento de Socket.IO. El Provider entrega estos datos
// al juego hijo sin pasar props por todos sus componentes intermedios.
const GameSessionContext = createContext(null);

// El servidor usa estos identificadores al validar salas y progreso.
const NOMBRES_JUEGO = {
  wordle: "Wordle",
  adivinaeljugador: "Adivina el jugador",
  futbol11: "Fútbol 11",
  grid: "Grid",
};

// `game` debe coincidir con el ID validado por el backend; `children` es el minijuego de la ruta.
export default function GameLobby({ game, children }) {
  const { socket, isConnected } = useSocket(BACKEND_URL);
  const [fase, setFase] = useState("elegir");
  const [modo, setModo] = useState(null);
  const [sala, setSala] = useState(null);
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [progresoRival, setProgresoRival] = useState(null);
  const [partidaPropiaTerminada, setPartidaPropiaTerminada] = useState(false);
  // Los listeners registrados abajo pueden sobrevivir muchos renders y conservar una `sala`
  // vieja en su closure. Esta ref se actualiza aparte para comparar eventos con el código vigente
  // sin destruir y registrar de nuevo todos los listeners cada vez que cambia la sala.
  const salaActual = useRef(null);

  // Informa cuando el primer intento de conexión tarda, incluso si el hook todavía no expone el socket.
  useEffect(() => {
    if (isConnected) {
      setAviso((actual) => (
        actual.startsWith("No se pudo conectar con el servidor")
          ? ""
          : actual
      ));
      return undefined;
    }

    const temporizador = setTimeout(() => {
      setAviso((actual) => actual || "El servidor todavía no responde. Revisá que backend esté iniciado en el puerto 4000.");
    }, 7000);

    return () => clearTimeout(temporizador);
  }, [isConnected]);

  // Mantiene una referencia inmediata para filtrar eventos de salas viejas.
  useEffect(() => {
    salaActual.current = sala;
  }, [sala]);

  // Aquí se registran los listeners del cliente para eventos que emite el backend:
  // - roomUpdated: estado/cantidad de jugadores de la sala.
  // - roomMatched: la segunda persona entró; los dos lobbies pasan a jugar.
  // - opponentProgress: datos públicos del progreso del rival.
  // - roomPlayerLeft / roomClosed: salida del rival o cierre de sala.
  // - disconnect / connect_error: caída del socket o error al conectarse.
  useEffect(() => {
    // useSocket asigna el objeto a un ref, y asignar un ref no causa un render.
    // Al primer render `socket` suele ser null y todavía no registramos nada. Cuando llega
    // connect, useSocket cambia isConnected; ese estado sí renderiza de nuevo y este efecto
    // recibe el socket para instalar los listeners. Los botones de sala están deshabilitados
    // hasta entonces. Si nunca conecta, el temporizador de arriba muestra el aviso de espera.
    if (!socket) return undefined;

    // Payload de roomUpdated: { room, game, status, players }.
    // Filtra por juego y por código para no pintar una actualización vieja o ajena.
    const actualizarSala = (estadoSala) => {
      if (!estadoSala || estadoSala.game !== game) return;
      if (salaActual.current && salaActual.current.room !== estadoSala.room) return;

      salaActual.current = estadoSala;
      setSala(estadoSala);
      if (estadoSala.status === "esperando") setFase("esperando");
    };

    // Payload de roomMatched: el mismo estado público de sala.
    // El invitado también puede haber pasado a jugando por su ACK de joinRoom; repetir setState
    // con el mismo estado no cambia la pantalla. El anfitrión depende de este broadcast para arrancar.
    const iniciarPartidaCompartida = (estadoSala) => {
      if (!estadoSala || estadoSala.game !== game) return;
      salaActual.current = estadoSala;
      setSala(estadoSala);
      setModo("online");
      setProgresoRival(null);
      setPartidaPropiaTerminada(false);
      setAviso("");
      setFase("jugando");
    };

    // Payload de opponentProgress: { position, name, progress, updatedAt }.
    // `progress` ya fue reconstruido/filtrado por el backend para el juego actual.
    const actualizarProgresoRival = (datos) => {
      if (datos && datos.progress) setProgresoRival(datos);
    };

    // Payload de roomPlayerLeft: { position, reason }.
    // El servidor deja la sala esperando a una nueva persona.
    const avisarSalidaRival = (datos) => {
      setProgresoRival(null);
      setAviso(
        datos && datos.reason === "desconexión"
          ? "La otra persona se desconectó. La sala quedó disponible para esperar a alguien más."
          : "La otra persona salió. La sala quedó disponible para volver a esperar."
      );
      setPartidaPropiaTerminada(false);
      setFase("esperando");
    };

    // En paralelo, useSocket marca isConnected=false. El backend elimina el socket viejo de
    // su sala; si Socket.IO logra reconectar, el nuevo socket.id no vuelve a entrar a esa sala.
    // Por eso descartamos el código local y pedimos crear una sala nueva o ingresar otra.
    const manejarDesconexion = () => {
      if (!salaActual.current) return;
      salaActual.current = null;
      setSala(null);
      setModo(null);
      setFase("elegir");
      setAviso("Se perdió la conexión. Creá una sala nueva o volvé a ingresar un código.");
    };

    // Error inicial de conexión. Este listener se instala cuando GameLobby ya recibe el socket;
    // si nunca hubo conexión exitosa, el temporizador de arriba es el aviso que sí queda activo.
    const manejarErrorConexion = (errorConexion) => {
      const mensaje = errorConexion?.message || "error de conexión";
      setAviso(`No se pudo conectar con el servidor (${mensaje}). Revisá que el backend esté activo.`);
    };

    // Payload de roomClosed: { room }. Solo afecta a la pantalla si coincide con nuestra sala.
    const cerrarSala = (datos) => {
      if (!salaActual.current || !datos || datos.room !== salaActual.current.room) return;
      salaActual.current = null;
      setSala(null);
      setModo(null);
      setFase("elegir");
      setAviso("La sala se cerró.");
    };

    socket.on("roomUpdated", actualizarSala); // Backend: io.to(código).emit; refleja estado de sala.
    socket.on("roomMatched", iniciarPartidaCompartida); // Broadcast al anfitrión y al invitado.
    socket.on("opponentProgress", actualizarProgresoRival); // Backend: socket.to(sala), solo rival.
    socket.on("roomPlayerLeft", avisarSalidaRival); // Lo recibe quien sigue dentro de la sala.
    socket.on("roomClosed", cerrarSala); // Handler preparado; hoy el último participante se limpia localmente.
    socket.on("disconnect", manejarDesconexion); // Evento local del transporte, no del backend de juego.
    socket.on("connect_error", manejarErrorConexion); // Error local; si nunca conectó, queda el aviso del temporizador.

    // Se quita exactamente la misma función que se registró con cada .on.
    // Así al volver a la ruta no quedan handlers viejos ni se procesa un evento dos veces.
    return () => {
      socket.off("roomUpdated", actualizarSala);
      socket.off("roomMatched", iniciarPartidaCompartida);
      socket.off("opponentProgress", actualizarProgresoRival);
      socket.off("roomPlayerLeft", avisarSalidaRival);
      socket.off("roomClosed", cerrarSala);
      socket.off("disconnect", manejarDesconexion);
      socket.off("connect_error", manejarErrorConexion);
    };
  }, [socket, game]);

  // Al desmontar la ruta este cleanup intenta leaveRoom si el socket sigue conectado.
  // useSocket también cierra el transporte al desmontar; por eso el backend tiene `disconnect`
  // como limpieza definitiva aunque leaveRoom ya no pueda salir por la red.
  useEffect(() => {
    return () => {
      if (salaActual.current && socket?.connected) socket.emit("leaveRoom"); // Pide liberar la sala.
    };
  }, [socket]);

  // Nombre de respaldo que se manda en createRoom/joinRoom. El servidor prefiere el nombre
  // que resolvió desde MySQL durante el handshake; este valor se usa si el socket no tiene perfil.
  const obtenerNombre = () => {
    if (typeof window === "undefined") return "Jugador";
    return window.localStorage.getItem("usuarioNombre") || "Jugador";
  };

  // Cambia de pantalla dentro de la ruta y monta el mismo hijo, pero no crea sala.
  // Si había una sala anterior, la deja primero; enviarProgreso no emite en modo "solo".
  const jugarSolo = () => {
    if (salaActual.current && socket) socket.emit("leaveRoom"); // No queda ocupando una sala online.
    salaActual.current = null;
    setSala(null);
    setModo("solo");
    setProgresoRival(null);
    setPartidaPropiaTerminada(false);
    setError("");
    setAviso("");
    setFase("jugando");
  };

  // Emite createRoom { game, name }. El callback es un ACK privado para este navegador;
  // no es lo que avisa a otros sockets. timeout(8000) limita la espera por ese ACK;
  // si vence, el primer argumento del callback es el error de timeout.
  const crearSala = () => {
    setError("");
    if (!socket || !socket.connected || !isConnected) {
      setError("Esperá a que se conecte el servidor para crear una sala.");
      return;
    }

    // Con respuesta: { ok, room } o { ok:false, error }. Sin respuesta en 8 s: timeout.
    socket.timeout(8000).emit("createRoom", { game, name: obtenerNombre() }, (tiempoAgotado, respuesta) => {
      // El timeout no es el rechazo del backend: error significa que no llegó ningún ACK a tiempo.
      if (tiempoAgotado) {
        setError("El servidor no respondió al crear la sala. Revisá la conexión e intentá otra vez.");
        return;
      }
      if (!respuesta || !respuesta.ok) {
        setError((respuesta && respuesta.error) || "No se pudo crear la sala.");
        return;
      }

      salaActual.current = respuesta.room;
      setSala(respuesta.room);
      setModo("online");
      setProgresoRival(null);
      setPartidaPropiaTerminada(false);
      // El creador NO empieza al recibir el ACK de createRoom: queda esperando a roomMatched.
      setFase("esperando");
      setAviso("");
    });
  };

  // Emite joinRoom { room, game, name }. El ACK vuelve solo al invitado y contiene estado.
  // Aparte, roomMatched se emite a toda la sala: ese segundo mensaje es el que despierta al anfitrión.
  const unirseASala = (evento) => {
    evento.preventDefault();
    setError("");
    if (!socket || !socket.connected || !isConnected) {
      setError("Esperá a que se conecte el servidor para ingresar a una sala.");
      return;
    }

    // El timeout hace visible el caso en que el evento de unión no recibe confirmación.
    socket.timeout(8000).emit(
      "joinRoom",
      { room: codigoIngresado.trim().toUpperCase(), game, name: obtenerNombre() }, // Código + juego esperado.
      (tiempoAgotado, respuesta) => {
        if (tiempoAgotado) {
          setError("El servidor no respondió al ingresar a la sala. Revisá la conexión e intentá otra vez.");
          return;
        }
        if (!respuesta || !respuesta.ok) {
          setError((respuesta && respuesta.error) || "No se pudo ingresar a la sala.");
          return;
        }

        salaActual.current = respuesta.room;
        setSala(respuesta.room);
        setModo("online");
        setProgresoRival(null);
        setPartidaPropiaTerminada(false);
        // En este punto solo el invitado recibe el ACK; si el backend devuelve "jugando", monta el juego.
        // El anfitrión usa el evento roomMatched que el backend emite a toda la sala.
        setFase(respuesta.room.status === "jugando" ? "jugando" : "esperando");
        setAviso("");
      }
    );
  };

  // leaveRoom no lleva código de sala: el servidor usa socket.data.room, dato que él controla.
  // La pantalla local vuelve enseguida al selector y no espera la confirmación del backend.
  const salirDePartida = () => {
    if (salaActual.current && socket) socket.emit("leaveRoom"); // El servidor toma la sala desde socket.data.
    salaActual.current = null;
    setSala(null);
    setModo(null);
    setProgresoRival(null);
    setPartidaPropiaTerminada(false);
    setFase("elegir");
  };

  // Usa la Clipboard API del navegador para copiar el código; el fallback muestra el código seleccionable.
  const copiarCodigo = async () => {
    if (!sala || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(sala.room);
      setAviso("Código copiado.");
    } catch {
      setAviso("No se pudo copiar el código. Podés seleccionarlo y copiarlo.");
    }
  };

  // API que recibe cada minijuego por Context. Cada uno arma su propio objeto progress;
  // acá se envuelve como { progress } para el evento sendProgress.
  // useCallback mantiene estable esta función: las useEffect de los juegos la tienen como
  // dependencia y, si cambiara en cada render, podrían publicar progreso innecesariamente.
  const enviarProgreso = useCallback((progress) => {
    if (modo !== "online" || !socket || !sala || sala.status !== "jugando") return;
    socket.emit("sendProgress", { progress }); // Sin ACK usado: el backend valida y avisa solo al rival.
  }, [modo, sala, socket]);

  // Solo amplía el panel rival en esta pantalla. No emite evento ni guarda resultado en backend;
  // el estado público ya se envía desde la useEffect del juego mediante enviarProgreso.
  const marcarPartidaTerminada = useCallback(() => {
    setPartidaPropiaTerminada(true);
  }, []);

  // Mantener estable el `value` evita renders/efectos extra del hijo que podrían republicar progreso.
  const valorSesion = useMemo(() => ({
    game,
    modo,
    sala,
    progresoRival,
    enviarProgreso,
    marcarPartidaTerminada,
  }), [game, modo, sala, progresoRival, enviarProgreso, marcarPartidaTerminada]);

  // Mientras la fase no sea "jugando", se muestra SOLO el lobby.
  // `children` sigue guardado como prop, pero no aparece en este return: el minijuego no está montado.
  if (fase !== "jugando") {
    return (
      <main className="lobbyJuego">
        <section className="lobbyTarjeta">
          <p className="lobbyEtiqueta">{NOMBRES_JUEGO[game] || game}</p>
          {fase === "esperando" ? (
            <>
              <h2>Esperando a otra persona</h2>
              <p>Compartí este código para que se una a tu sala.</p>
              <div className="codigoSalaCompartir">
                <strong>{sala ? sala.room : "------"}</strong>
                <button type="button" onClick={copiarCodigo}>Copiar código</button>
              </div>
              <p>{sala ? sala.players.length : 1} de 2 jugadores en la sala</p>
              <p className="estadoConexion" role="status">
                {isConnected ? "La sala está lista para recibir a tu rival." : "Reconectando al servidor..."}
              </p>
              <button className="botonSecundarioLobby" type="button" onClick={salirDePartida}>
                Cancelar y volver
              </button>
            </>
          ) : (
            <>
              <h2>¿Cómo querés jugar?</h2>
              <p>En una sala, cada persona recibe su propio desafío aleatorio.</p>
              <div className="lobbyAcciones">
                <button type="button" onClick={jugarSolo}>Jugar solo</button>
                <button type="button" onClick={crearSala} disabled={!isConnected}>
                  Jugar de a 2 · Crear sala
                </button>
              </div>
              <form className="lobbyUnirse" onSubmit={unirseASala}>
                <label htmlFor="codigoSala">¿Ya tenés un código? Ingresalo para jugar de a 2</label>
                <div>
                  <input
                    id="codigoSala"
                    value={codigoIngresado}
                    onChange={(evento) => setCodigoIngresado(evento.target.value)}
                    maxLength={6}
                    autoComplete="off"
                    placeholder="Código de sala"
                  />
                  <button type="submit" disabled={!isConnected || !codigoIngresado.trim()}>
                    Unirme
                  </button>
                </div>
              </form>
              <p className="estadoConexion" role="status">
                {isConnected ? "Conectado al servidor" : "Conectando al servidor..."}
              </p>
            </>
          )}
          {error && <p className="errorSocket" role="alert">{error}</p>}
          {aviso && <p className="avisoSocket" role="status">{aviso}</p>}
        </section>
      </main>
    );
  }

  // Ahora sí arranca el juego: el Provider pone el contexto por encima de `children`.
  // Por eso WordleGame puede llamar useGameSession() y recibir los valores declarados arriba.
  // En modo solo tampoco se muestra barra ni panel de rival.
  return (
    <GameSessionContext.Provider value={valorSesion}>
      <div className="sesionJuego">
        {modo === "online" && (
          <div className="barraSesionOnline">
            <span>Sala {sala ? sala.room : ""} · {sala ? sala.players.length : 0}/2 jugadores</span>
            <button type="button" onClick={salirDePartida}>Salir de la partida</button>
          </div>
        )}
        {aviso && <p className="avisoSocket" role="status">{aviso}</p>}
        {children}
        {modo === "online" && (
          <OpponentProgress
            game={game}
            player={progresoRival}
            expanded={partidaPropiaTerminada}
            onClose={() => setPartidaPropiaTerminada(false)}
            onExpand={() => setPartidaPropiaTerminada(true)}
          />
        )}
      </div>
    </GameSessionContext.Provider>
  );
}

// Hook de acceso al Context; avisa de inmediato si una página lo usa fuera de GameLobby.
export function useGameSession() {
  const contexto = useContext(GameSessionContext);
  if (!contexto) throw new Error("useGameSession debe usarse dentro de GameLobby.");
  return contexto;
}
