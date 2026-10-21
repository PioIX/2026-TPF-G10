//es el componente más importante del proyecto: es la sala de espera de los juegos y maneja todo el modo multijugador. Es uno de los 3 componentes que sí están conectados
//Antes de que empiece cualquier juego, te pregunta cómo querés jugar: solo, creando una sala, o entrando con un código. Cuando la partida arranca, muestra el juego y el progreso del rival.
//“GameLobby es el componente que envuelve cada minijuego y gestiona el modo online. Primero muestra la elección entre jugar solo, crear una sala o unirse con un código. Usa Socket.IO para crear y unir salas, y cuando entran dos jugadores arranca la partida. Con un Context comparte los datos de la sala con el juego, y muestra el progreso del rival en tiempo real. Así los cuatro juegos reutilizan el mismo código multijugador.”
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

// Comparte el estado de sala con la lógica del minijuego que se monta adentro.
const GameSessionContext = createContext(null);

// El servidor usa estos identificadores al validar salas y progreso.
const NOMBRES_JUEGO = {
  wordle: "Wordle",
  adivinaeljugador: "Adivina el jugador",
  futbol11: "Fútbol 11",
  grid: "Grid",
};

// Envía la cookie de sesión para que Socket.IO comparta la sesión HTTP del login.
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const OPCIONES_SOCKET = { withCredentials: true };

// Pone primero la elección de modo, así cada juego sortea su desafío al empezar.
export default function GameLobby({ game, children }) {
  const { socket, isConnected } = useSocket(SOCKET_URL, OPCIONES_SOCKET);
  const [fase, setFase] = useState("elegir");
  const [modo, setModo] = useState(null);
  const [sala, setSala] = useState(null);
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [progresoRival, setProgresoRival] = useState(null);
  const [partidaPropiaTerminada, setPartidaPropiaTerminada] = useState(false);
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

  // Escucha únicamente los eventos de la sala del juego abierto. El lobby sigue montado al cambiar de espera a partida, así conserva esta conexión.
  useEffect(() => {
    if (!socket) return undefined;

    const actualizarSala = (estadoSala) => {
      if (!estadoSala || estadoSala.game !== game) return;
      if (salaActual.current && salaActual.current.room !== estadoSala.room) return;

      salaActual.current = estadoSala;
      setSala(estadoSala);
      if (estadoSala.status === "esperando") setFase("esperando");
    };

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

    const actualizarProgresoRival = (datos) => {
      if (datos && datos.progress) setProgresoRival(datos);
    };

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

    // La conexión perdida invalida el código de la sala guardada en memoria.
    const manejarDesconexion = () => {
      if (!salaActual.current) return;
      salaActual.current = null;
      setSala(null);
      setModo(null);
      setFase("elegir");
      setAviso("Se perdió la conexión. Creá una sala nueva o volvé a ingresar un código.");
    };

    // Explica en pantalla los errores del handshake en vez de dejar el lobby cargando sin respuesta.
    const manejarErrorConexion = (errorConexion) => {
      const mensaje = errorConexion?.message || "error de conexión";
      setAviso(`No se pudo conectar con el servidor (${mensaje}). Revisá que el backend esté activo.`);
    };

    const cerrarSala = (datos) => {
      if (!salaActual.current || !datos || datos.room !== salaActual.current.room) return;
      salaActual.current = null;
      setSala(null);
      setModo(null);
      setFase("elegir");
      setAviso("La sala se cerró.");
    };

    socket.on("roomUpdated", actualizarSala);
    socket.on("roomMatched", iniciarPartidaCompartida);
    socket.on("opponentProgress", actualizarProgresoRival);
    socket.on("roomPlayerLeft", avisarSalidaRival);
    socket.on("roomClosed", cerrarSala);
    socket.on("disconnect", manejarDesconexion);
    socket.on("connect_error", manejarErrorConexion);

    // Quita estos listeners al salir del juego para evitar respuestas duplicadas.
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

  // Solo al salir de la ruta se abandona la sala; cambiar entre espera y partida no desmonta este componente ni su socket.
  useEffect(() => {
    return () => {
      if (salaActual.current && socket?.connected) socket.emit("leaveRoom");
    };
  }, [socket]);

  // Lee el nombre público guardado al iniciar sesión, sin acceder a localStorage durante SSR.
  const obtenerNombre = () => {
    if (typeof window === "undefined") return "Jugador";
    return window.localStorage.getItem("usuarioNombre") || "Jugador";
  };

  // Empieza una partida local sin crear una sala.
  const jugarSolo = () => {
    if (salaActual.current && socket) socket.emit("leaveRoom");
    salaActual.current = null;
    setSala(null);
    setModo("solo");
    setProgresoRival(null);
    setPartidaPropiaTerminada(false);
    setError("");
    setAviso("");
    setFase("jugando");
  };

  // Pide al backend una sala y muestra el código mientras espera al segundo jugador.
  const crearSala = () => {
    setError("");
    if (!socket || !socket.connected || !isConnected) {
      setError("Esperá a que se conecte el servidor para crear una sala.");
      return;
    }

    // El timeout permite distinguir una sala rechazada de un backend que no contestó.
    socket.timeout(8000).emit("createRoom", { game, name: obtenerNombre() }, (tiempoAgotado, respuesta) => {
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
      setFase("esperando");
      setAviso("");
    });
  };

  // Entra a una sala existente con el código y verifica que corresponda a este juego.
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
      { room: codigoIngresado.trim().toUpperCase(), game, name: obtenerNombre() },
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
        setFase(respuesta.room.status === "jugando" ? "jugando" : "esperando");
        setAviso("");
      }
    );
  };

  // Sale de la sala activa y vuelve a la elección de modo.
  const salirDePartida = () => {
    if (salaActual.current && socket) socket.emit("leaveRoom");
    salaActual.current = null;
    setSala(null);
    setModo(null);
    setProgresoRival(null);
    setPartidaPropiaTerminada(false);
    setFase("elegir");
  };

  // Copia el código para poder compartirlo con otra persona.
  const copiarCodigo = async () => {
    if (!sala || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(sala.room);
      setAviso("Código copiado.");
    } catch {
      setAviso("No se pudo copiar el código. Podés seleccionarlo y copiarlo.");
    }
  };

  // Envía solo el progreso permitido por el servidor para este minijuego.
  const enviarProgreso = useCallback((progress) => {
    if (modo !== "online" || !socket || !sala || sala.status !== "jugando") return;
    socket.emit("sendProgress", { progress });
  }, [modo, sala, socket]);

  // Abre el seguimiento ampliado del rival cuando termina la partida propia.
  const marcarPartidaTerminada = useCallback(() => {
    setPartidaPropiaTerminada(true);
  }, []);

  // Comparte las funciones de sala con la lógica interna del minijuego.
  const valorSesion = useMemo(() => ({
    game,
    modo,
    sala,
    progresoRival,
    enviarProgreso,
    marcarPartidaTerminada,
  }), [game, modo, sala, progresoRival, enviarProgreso, marcarPartidaTerminada]);

  // Antes de iniciar, ofrece partida individual, crear sala o ingresar un código.
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

  // Mantiene visible el código y el progreso rival durante una partida compartida.
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

// Devuelve la información de sala disponible dentro de cada partida.
export function useGameSession() {
  const contexto = useContext(GameSessionContext);
  if (!contexto) throw new Error("useGameSession debe usarse dentro de GameLobby.");
  return contexto;
}
