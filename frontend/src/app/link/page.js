// src/app/link/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import "../global.css";
import GameLobby, { useGameSession } from "../../components/GameLobby";
import GoalCelebration from "../../components/GoalCelebration";
import { BACKEND_URL } from "../../config/backend";
import { comentarioFutbolero } from "../../utils/comentariosFutboleros";

const API_URL = BACKEND_URL;
const PISTAS_TOTALES = 5;
const MAX_INTENTOS = 6; // 5 para destapar a todos + 1 chance extra al final

function limpiarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toLowerCase()
    .trim();
}

// Verifica si dos rangos de tiempo en el mismo club se cruzan (solapamiento temporal)
function compartieronCanchaTemporalmente(trayectoriaA, trayectoriaB) {
  for (const tA of trayectoriaA) {
    for (const tB of trayectoriaB) {
      if (limpiarTexto(tA.club) === limpiarTexto(tB.club)) {
        const currentYear = new Date().getFullYear();
        
        // Si el backend manda 0, se asume inicio muy viejo o presente para no romper por falta de datos
        const inicioA = tA.ingreso > 0 ? tA.ingreso : 1900;
        const finA = tA.traspaso > 0 ? tA.traspaso : currentYear;
        
        const inicioB = tB.ingreso > 0 ? tB.ingreso : 1900;
        const finB = tB.traspaso > 0 ? tB.traspaso : currentYear;

        // Lógica de intersección de rangos: El inicio de uno es menor al fin del otro, y viceversa
        if (inicioA <= finB && finA >= inicioB) {
          return true;
        }
      }
    }
  }
  return false;
}

export default function LinkPage() {
  return (
    <GameLobby game="link">
      <LinkGame />
    </GameLobby>
  );
}

function LinkGame() {
  const { enviarProgreso, marcarPartidaTerminada } = useGameSession();

  const [jugadoresTotales, setJugadoresTotales] = useState([]);
  const [nombresSugerencias, setNombresSugerencias] = useState([]);
  
  const [jugadorObjetivo, setJugadorObjetivo] = useState(null);
  const [pistas, setPistas] = useState([]); 
  const [intentosFallidos, setIntentosFallidos] = useState(0); 
  
  const [estadoPartida, setEstadoPartida] = useState("jugando");
  const [inputAdivinar, setInputAdivinar] = useState("");
  const [mensaje, setMensaje] = useState(`Adiviná el objetivo. Tenés ${MAX_INTENTOS} intentos totales.`);

  const prepararPartida = useCallback((datos) => {
    const jugadoresMap = new Map();
    const nombresSet = new Set();

    // 1. Agrupar historial por jugador con sus fechas
    datos.forEach((fila) => {
      const id = fila.id_jugador;
      if (!id) return;

      if (!jugadoresMap.has(id)) {
        jugadoresMap.set(id, {
          id,
          nombre: `${fila.nombre || ""} ${fila.apellido || ""}`.trim(),
          trayectoria: [],
        });
      }

      const jugador = jugadoresMap.get(id);
      nombresSet.add(jugador.nombre);

      const club = fila.nombre_equipo || "";
      if (club) {
        jugador.trayectoria.push({
          club,
          ingreso: Number(fila.anio_ingreso) || 0,
          traspaso: Number(fila.anio_traspaso) || 0,
        });
      }
      
      // Aseguramos el club actual como un periodo hasta la fecha
      if (fila.club_actual && limpiarTexto(fila.club_actual) !== limpiarTexto(club)) {
        jugador.trayectoria.push({
          club: fila.club_actual,
          ingreso: Number(fila.anio_ingreso) || 0, 
          traspaso: new Date().getFullYear(),
        });
      }
    });

    const listaJugadores = Array.from(jugadoresMap.values());
    setJugadoresTotales(listaJugadores);
    setNombresSugerencias(Array.from(nombresSet).sort());

    // 2. Buscar un objetivo válido con chequeo temporal estricto
    const posiblesObjetivos = [...listaJugadores].sort(() => Math.random() - 0.5);
    let objetivoElegido = null;
    let companerosElegidos = [];

    for (const candidato of posiblesObjetivos) {
      const companeros = listaJugadores.filter(otro => {
        if (otro.id === candidato.id) return false;
        return compartieronCanchaTemporalmente(candidato.trayectoria, otro.trayectoria);
      });

      if (companeros.length >= PISTAS_TOTALES) {
        objetivoElegido = candidato;
        companerosElegidos = companeros.sort(() => Math.random() - 0.5).slice(0, PISTAS_TOTALES);
        break;
      }
    }

    if (objetivoElegido) {
      setJugadorObjetivo(objetivoElegido);
      setPistas(companerosElegidos);
      setIntentosFallidos(0);
      setEstadoPartida("jugando");
    } else {
      setMensaje("No hay suficientes datos con fechas cruzadas en la base.");
    }
  }, []);

  const cargarJugadores = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/jugadores`);
      const datos = await respuesta.json();
      if (Array.isArray(datos) && datos.length > 0) {
        prepararPartida(datos);
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error al cargar la base de datos.");
    }
  }, [prepararPartida]);

  useEffect(() => {
    cargarJugadores();
  }, [cargarJugadores]);

  const intentarAdivinar = () => {
    if (estadoPartida !== "jugando" || !jugadorObjetivo) return;

    const textoIngresado = limpiarTexto(inputAdivinar);
    
    if (!nombresSugerencias.some(n => limpiarTexto(n) === textoIngresado)) {
      setMensaje("Seleccioná un nombre válido de la lista.");
      return;
    }

    if (textoIngresado === limpiarTexto(jugadorObjetivo.nombre)) {
      setEstadoPartida("ganado");
      setMensaje(`¡Excelente! ${comentarioFutbolero("acierto")} Era ${jugadorObjetivo.nombre}.`);
      marcarPartidaTerminada();
    } else {
      const nuevosFallos = intentosFallidos + 1;
      setIntentosFallidos(nuevosFallos);
      setInputAdivinar("");

      if (nuevosFallos >= MAX_INTENTOS) {
        setEstadoPartida("perdido");
        setMensaje(`Perdiste. El jugador oculto era ${jugadorObjetivo.nombre}.`);
        marcarPartidaTerminada();
      } else if (nuevosFallos === MAX_INTENTOS - 1) {
        setMensaje(`¡Cuidado! Te queda tu última chance y ya tenés a todos revelados.`);
      } else {
        const revelados = Math.min(nuevosFallos + 1, PISTAS_TOTALES);
        setMensaje(`Incorrecto. Se reveló la pista ${revelados}/${PISTAS_TOTALES}. Te quedan ${MAX_INTENTOS - nuevosFallos} intentos.`);
      }
    }
  };

  useEffect(() => {
    enviarProgreso({
      intentosUsados: intentosFallidos,
      terminado: estadoPartida !== "jugando",
      adivino: estadoPartida === "ganado",
    });
  }, [intentosFallidos, estadoPartida, enviarProgreso]);

  return (
    <>
      {estadoPartida === "ganado" && <GoalCelebration />}
      <main id="main">
        <h2 style={{ textAlign: "center", color: "#f1c40f", marginBottom: "10px" }}>
          FUTBOL11 LINK
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
          
          {/* Jugador Objetivo */}
          <div 
            style={{ 
              width: "120px", height: "140px", backgroundColor: "#c0392b",
              border: estadoPartida === "jugando" ? "2px solid #e74c3c" : "2px solid #2ecc71", 
              borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: "bold", textAlign: "center", padding: "10px",
              boxShadow: estadoPartida !== "jugando" ? "0 0 15px #2ecc71" : "0 0 15px #e74c3c",
              zIndex: 2
            }}
          >
            {estadoPartida !== "jugando" 
              ? jugadorObjetivo?.nombre 
              : "?"}
          </div>

          {/* Llaves conectoras */}
          <div style={{
            width: "80%", height: "20px",
            borderTop: "2px solid #3498db", borderLeft: "2px solid #3498db", borderRight: "2px solid #3498db",
            marginTop: "-2px", zIndex: 1
          }}></div>
          <div style={{
            width: "2px", height: "20px", backgroundColor: "#3498db", zIndex: 1
          }}></div>

          {/* Compañeros */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {pistas.map((pista, index) => {
              // La primera (index 0) siempre se ve. Las demás se ven según los fallos.
              const visible = estadoPartida !== "jugando" || index <= intentosFallidos;

              return (
                <div key={index} style={{ textAlign: "center", width: "90px" }}>
                  <div 
                    style={{ 
                      width: "100%", height: "110px", backgroundColor: visible ? "#2980b9" : "#34495e",
                      border: "2px solid #3498db", borderRadius: "8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: visible ? "white" : "#7f8c8d", fontSize: visible ? "0.8rem" : "2rem",
                      padding: "5px"
                    }}
                  >
                    {visible ? pista.nombre : "?"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div id="caja-preguntas" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "40px" }}>
          <p id="mensaje-juego" className="mensaje-juego" style={{ height: "40px", textAlign: "center" }}>
            {mensaje}
          </p>

          <div id="caja-adivinar" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <input
              type="text"
              id="input-adivinar"
              className="input-pill"
              list="sugerencias-nombres"
              placeholder="¿Quién es el objetivo?"
              value={inputAdivinar}
              onChange={(e) => setInputAdivinar(e.target.value)}
              disabled={estadoPartida !== "jugando"}
            />
            <datalist id="sugerencias-nombres">
              {nombresSugerencias.map((nombre, idx) => (
                <option key={idx} value={nombre} />
              ))}
            </datalist>
            <button
              id="btn-adivinar"
              type="button"
              className="btn-accion"
              onClick={intentarAdivinar}
              disabled={estadoPartida !== "jugando" || !inputAdivinar.trim()}
            >
              Adivinar
            </button>
          </div>
        </div>
      </main>
    </>
  );
}