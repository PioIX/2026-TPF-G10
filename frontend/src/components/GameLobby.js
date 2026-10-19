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
import { useSocket } from "./SocketProvider";
import OpponentProgress from "./OpponentProgress";

const GameSessionContext = createContext(null);
const NOMBRES_JUEGO = {
  wordle: "Wordle",
  adivinaeljugador: "Adivina el jugador",
  futbol11: "Fútbol 11",
  grid: "Grid",
};

/**
 * Comparte una entrada común para los cuatro juegos: modo individual o sala por código.
 * Los componentes de juego se montan recién al empezar, así cada uno genera su partida aleatoria.
 */
export default function GameLobby({ game, children }) {
  const { socket, isConnected } = useSocket();
  const [fase, setFase] = useState("elegir");
  const [modo, setModo] = useState(null);
  const [sala, setSala] = useState(null);
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [progresoRival, setProgresoRival] = useState(null);
  const [partidaPropiaTerminada, setPartidaPropiaTerminada] = useState(false);
  const salaActual = useRef(null);

  // Conserva el código de sala actual para que los eventos solo actualicen esta partida.
  useEffect(() => {
    salaActual.current = sala;
  }, [sala]);

  // Escucha los cambios de sala y de avance del rival durante esta página.
  useEffect(() => {
    if (!socket) return undefined;

    const actualizarSala = (estadoSala) => {
      if (!estadoSala || estadoSala.game !== game) return;
      if (
        salaActual.current &&
        salaActual.current.room !== estadoSala.room
      ) {
        return;
      }
      salaActual.current = estadoSala;
      setSala(estadoSala);
    };

    const iniciarPartidaCompartida = (estadoSala) => {
      if (!estadoSala || estadoSala.game !== game) return;
      salaActual.current = estadoSala;
      setSala(estadoSala);
      setModo("online");
      setAviso("");
      setFase("jugando");
    };

    const actualizarProgresoRival = (datos) => {
      if (datos && datos.progress) setProgresoRival(datos);
    };

    const avisarSalidaRival = (datos) => {
      setAviso(
        datos && datos.reason === "desconexión"
          ? "El otro jugador se desconectó. La sala quedó disponible para volver a esperar."
          : "El otro jugador salió de la sala."
      );
    };

    const cerrarSala = (datos) => {
      if (salaActual.current && datos && datos.room === salaActual.current.room) {
        salaActual.current = null;
        setSala(null);
        setModo(null);
        setFase("elegir");
        setAviso("La sala se cerró.");
      }
    };

    socket.on("roomUpdated", actualizarSala);
    socket.on("roomMatched", iniciarPartidaCompartida);
    socket.on("opponentProgress", actualizarProgresoRival);
    socket.on("roomPlayerLeft", avisarSalidaRival);
    socket.on("roomClosed", cerrarSala);

    return () => {
      socket.off("roomUpdated", actualizarSala);
      socket.off("roomMatched", iniciarPartidaCompartida);
      socket.off("opponentProgress", actualizarProgresoRival);
      socket.off("roomPlayerLeft", avisarSalidaRival);
      socket.off("roomClosed", cerrarSala);
    };
  }, [socket, game]);

  // Libera la sala al salir de la página para que la otra persona reciba el aviso.
  useEffect(() => {
    return () => {
      if (salaActual.current && socket) socket.emit("leaveRoom");
    };
  }, [socket]);

  const obtenerNombre = () => {
    if (typeof window === "undefined") return "Jugador";
    return window.localStorage.getItem("usuarioNombre") || "Jugador";
  };

  // Inicia una partida local sin crear ni unirse a una sala.
  const jugarSolo = () => {
    if (salaActual.current && socket) socket.emit("leaveRoom");
    salaActual.current = null;
    setSala(null);
    setModo("solo");
    setProgresoRival(null);
    setPartidaPropiaTerminada(false);
    setFase("jugando");
  };

  // Pide al backend una sala nueva para el juego que ya eligió la persona.
  const crearSala = () => {
    setError("");
    if (!socket || !isConnected) {
      setError("Esperá a que se conecte el servidor para crear una sala.");
      return;
    }

    socket.emit("createRoom", { game, name: obtenerNombre() }, (respuesta) => {
      if (!respuesta || !respuesta.ok) {
        setError((respuesta && respuesta.error) || "No se pudo crear la sala.");
        return;
      }

      salaActual.current = respuesta.room;
      setSala(respuesta.room);
      setModo("online");
      setFase("esperando");
      setAviso("");
    });
  };

  // Valida el código en el backend y entra a la sala si sigue esperando un rival.
  const unirseASala = (evento) => {
    evento.preventDefault();
    setError("");
    if (!socket || !isConnected) {
      setError("Esperá a que se conecte el servidor para ingresar a una sala.");
      return;
    }

    socket.emit(
      "joinRoom",
      { room: codigoIngresado.trim().toUpperCase(), game, name: obtenerNombre() },
      (respuesta) => {
        if (!respuesta || !respuesta.ok) {
          setError((respuesta && respuesta.error) || "No se pudo ingresar a la sala.");
          return;
        }

        salaActual.current = respuesta.room;
        setSala(respuesta.room);
        setModo("online");
        setFase(respuesta.room.status === "jugando" ? "jugando" : "esperando");
        setAviso("");
      }
    );
  };

  // Permite abandonar la partida y volver a elegir el modo.
  const salirDePartida = () => {
    if (salaActual.current && socket) socket.emit("leaveRoom");
    salaActual.current = null;
    setSala(null);
    setModo(null);
    setProgresoRival(null);
    setPartidaPropiaTerminada(false);
    setFase("elegir");
  };

  // Copia el código para compartirlo en el chat o con otra persona.
  const copiarCodigo = async () => {
    if (!sala || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(sala.room);
      setAviso("Código copiado.");
    } catch {
      setAviso("No se pudo copiar el código. Podés seleccionarlo y copiarlo.");
    }
  };

  // Envía únicamente el resumen público que corresponda al juego actual.
  const enviarProgreso = useCallback(
    (progress) => {
      if (modo !== "online" || !socket || !sala || sala.status !== "jugando") {
        return;
      }
      socket.emit("sendProgress", { progress });
    },
    [modo, sala, socket]
  );

  const marcarPartidaTerminada = useCallback(() => {
    setPartidaPropiaTerminada(true);
  }, []);

  const valorSesion = useMemo(
    () => ({
      game,
      modo,
      sala,
      socket,
      progresoRival,
      enviarProgreso,
      marcarPartidaTerminada,
    }),
    [
      game,
      modo,
      sala,
      socket,
      progresoRival,
      enviarProgreso,
      marcarPartidaTerminada,
    ]
  );

  if (fase !== "jugando") {
    return (
      <main className="lobbyJuego">
        <section className="lobbyTarjeta">
          <p className="lobbyEtiqueta">{NOMBRES_JUEGO[game] || game}</p>
          {fase === "esperando" ? (
            <>
              <h2>Esperando a otro jugador</h2>
              <p>Compartí este código para que se una a tu sala.</p>
              <div className="codigoSalaCompartir">
                <strong>{sala ? sala.room : "------"}</strong>
                <button type="button" onClick={copiarCodigo}>Copiar código</button>
              </div>
              <p>
                {sala ? sala.players.length : 1} de 2 jugadores en la sala
              </p>
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
                <button type="button" onClick={jugarSolo}>
                  Jugar solo
                </button>
                <button type="button" onClick={crearSala} disabled={!isConnected}>
                  Crear sala
                </button>
              </div>

              <form className="lobbyUnirse" onSubmit={unirseASala}>
                <label htmlFor="codigoSala">O ingresá el código de otra persona</label>
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

  return (
    <GameSessionContext.Provider value={valorSesion}>
      <div className="sesionJuego">
        {modo === "online" && (
          <div className="barraSesionOnline">
            <span>
              Sala {sala ? sala.room : ""} · {sala ? sala.players.length : 0}/2 jugadores
            </span>
            <button type="button" onClick={salirDePartida}>
              Salir de la partida
            </button>
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
          />
        )}
      </div>
    </GameSessionContext.Provider>
  );
}

/** Devuelve la sala y las funciones de Socket.IO disponibles dentro del juego. */
export function useGameSession() {
  const contexto = useContext(GameSessionContext);
  if (!contexto) {
    throw new Error("useGameSession debe usarse dentro de GameLobby.");
  }
  return contexto;
}
