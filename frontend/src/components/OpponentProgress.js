"use client";

import SportsImage from "./SportsImage";

// Define el contador principal y su límite para cada minijuego.
// Traduce cada juego a su contador y límite para que la tarjeta rival use un formato común.
const DETALLES_PROGRESO = {
  wordle: { campo: "intentosUsados", maximo: 6, unidad: "intentos" },
  adivinaeljugador: { campo: "preguntasUsadas", maximo: 10, unidad: "preguntas o intentos" },
  futbol11: { campo: "jugadoresColocados", maximo: 11, unidad: "posiciones" },
  grid: { campo: "celdasCompletadas", maximo: 9, unidad: "celdas" },
  link: { campo: "intentosUsados", maximo: 6, unidad: "intentos" },
  quienmas: { campo: "comparaciones", maximo: 5, unidad: "comparaciones" },
};

// GameLobby le pasa el último objeto recibido por opponentProgress. Es una foto del estado más
// reciente, no un historial de eventos. Este componente no abre sockets; solo representa el payload.
// Resume el último progreso recibido del rival y permite abrir o cerrar su vista ampliada.
export default function OpponentProgress({ game, player, expanded = false, onClose, onExpand }) {
  const definicion = DETALLES_PROGRESO[game];
  const progreso = player && player.progress;
  // El mismo componente sirve para todos los juegos porque DETALLES_PROGRESO indica
  // qué propiedad leer y cuál es el máximo esperado para convertirla a porcentaje.
  const cantidad = definicion && progreso ? progreso[definicion.campo] : 0;
  const porcentaje = definicion
    ? Math.min(100, Math.round((cantidad / definicion.maximo) * 100))
    : 0;

  // Los juegos tienen payloads distintos, pero comparten el contador indicado en DETALLES_PROGRESO
  // y `terminado`; Wordle/Adivina agregan el booleano que permite describir cómo terminó.
  let estado = "Esperando el primer avance del rival...";
  if (progreso && progreso.terminado) {
    if (game === "wordle") estado = progreso.gano ? "Terminó: acertó" : "Terminó los intentos";
    else if (game === "adivinaeljugador") estado = progreso.adivino ? "Terminó: adivinó" : "Terminó sin adivinar";
    else if (game === "link") estado = progreso.adivino ? "Terminó: encontró al objetivo" : "Terminó sin encontrarlo";
    else if (game === "quienmas") estado = `Terminó: ${progreso.puntaje} de 5 aciertos`;
    else estado = "Partida terminada";
  } else if (progreso) {
    estado = `${cantidad} de ${definicion.maximo} ${definicion.unidad}`;
  }

  return (
    <aside
      className={expanded ? "panelProgresoRival panelProgresoRivalAmpliado" : "panelProgresoRival"}
      aria-live="polite"
    >
      <div className="panelProgresoCabecera">
        <div>
          <p className="lobbyEtiqueta">Partida en vivo</p>
          <h2>{(player && player.name) || "Tu rival"}</h2>
        </div>
        {expanded && <span className="etiquetaEspectador">Seguimiento de la otra partida</span>}
      </div>

      {expanded && onClose ? (
        <button className="botonCerrarEspectador" type="button" onClick={onClose}>
          Volver a mi partida
        </button>
      ) : (
        <button className="botonAmpliarProgreso" type="button" onClick={onExpand}>
          Ampliar seguimiento
        </button>
      )}

      <div className="barraProgresoRival" aria-label="Progreso del rival">
        <div style={{ width: `${porcentaje}%` }} />
      </div>
      <p>{estado}</p>

      {/* Wordle comparte intentos y colores, pero nunca la palabra secreta. */}
      {progreso && game === "wordle" && Array.isArray(progreso.tablero) && (
        <div className="tableroRival" aria-label="Tablero de Wordle del rival">
          {progreso.tablero.map((fila, indiceFila) => (
            <div
              className="filaTableroRival"
              key={indiceFila}
              style={{ gridTemplateColumns: `repeat(${fila.length}, minmax(22px, 1fr))` }}
            >
              {fila.map((celda, indiceCelda) => (
                <span
                  className="celdaTableroRival"
                  key={indiceCelda}
                  style={{ backgroundColor: celda.color }}
                >
                  {celda.letra === "_" ? "" : celda.letra}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Adivina comparte preguntas y fallos; el backend filtra la respuesta acertada. */}
      {progreso && game === "adivinaeljugador" && (
        <div className="historialRival">
          {progreso.pistaActiva && <p>Usó una pista.</p>}
          {Array.isArray(progreso.respuestas) && progreso.respuestas.length > 0 ? (
            <ul>{progreso.respuestas.map((respuesta, indice) => <li key={indice}>{respuesta}</li>)}</ul>
          ) : <p>Todavía no hizo preguntas.</p>}
        </div>
      )}

      {progreso && game === "link" && (
        <div className="historialRival">
          <p>Compañeros revelados:</p>
          {Array.isArray(progreso.pistasReveladas) && progreso.pistasReveladas.length > 0
            ? <ul>{progreso.pistasReveladas.map((nombre, indice) => <li key={indice}>{nombre}</li>)}</ul>
            : <p>Todavía no hay pistas reveladas.</p>}
        </div>
      )}

      {/* En Quién tiene más se muestra cuántas comparaciones respondió el rival y su puntaje. */}
      {progreso && game === "quienmas" && (
        <div className="historialRival historialComparaciones">
          <div className="historialComparacionesTitulo"><strong>Rondas jugadas</strong><span>{progreso.puntaje} / 5 aciertos</span></div>
          {Array.isArray(progreso.historial) && progreso.historial.length ? (
            <ol>{progreso.historial.map((ronda, indice) => (
              <li className={ronda.correcto ? "comparacionCorrecta" : "comparacionIncorrecta"} key={`${indice}-${ronda.categoria}`}>
                <span className="comparacionNumero">{String(indice + 1).padStart(2, "0")}</span>
                <span className="comparacionDetalle"><strong>{ronda.categoria}</strong><small>Eligió: {ronda.elegido || "—"}</small></span>
                <span className="comparacionEstado">{ronda.correcto ? "✓" : "×"}</span>
                <div className="comparacionJugadores">
                  {[{ nombre: ronda.primero, valor: ronda.valorPrimero }, { nombre: ronda.segundo, valor: ronda.valorSegundo }].map((jugador, jugadorIndice) => (
                    <div className={jugador.nombre === ronda.ganador ? "comparacionJugador ganador" : "comparacionJugador"} key={`${jugador.nombre}-${jugadorIndice}`}>
                      <SportsImage tipo="player" nombre={jugador.nombre} alt="" size={40} />
                      <span>{jugador.nombre}</span>
                      <strong>{jugador.valor}</strong>
                    </div>
                  ))}
                </div>
              </li>
            ))}</ol>
          ) : <p>Esperando la primera comparación…</p>}
        </div>
      )}

      {/* Fútbol 11 muestra solo los jugadores que ya se ven en la cancha rival. */}
      {progreso && game === "futbol11" && Array.isArray(progreso.formacion) && (
        <div className="formacionRival canchaRival">
          {progreso.paisActual && <p>País actual: {progreso.paisActual}</p>}
          <div className="canchaRivalCampo">
            {progreso.formacion.map((jugador, indice) => (
              <div className={`canchaRivalPuesto ${jugador ? "ocupado" : ""}`} key={indice} style={{ "--puesto-x": `${[18, 50, 82, 30, 50, 70, 14, 38, 62, 86, 50][indice]}%`, "--puesto-y": `${[22, 18, 22, 45, 50, 55, 74, 79, 79, 74, 92][indice]}%` }}>
                <span className="canchaRivalCamiseta" aria-hidden="true" />
                <span className="canchaRivalNombre">{jugador || `Puesto ${indice + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid comparte los encabezados y marca las celdas resueltas sin mostrar el nombre acertado. */}
      {progreso && game === "grid" && Array.isArray(progreso.filas) && Array.isArray(progreso.columnas) && (
        <div className="grillaRival">
          <div className="filaGrillaRival encabezadoGrillaRival">
            <strong>País / equipo</strong>
            {progreso.columnas.map((columna, indice) => <strong key={indice}>{columna}</strong>)}
          </div>
          {/* Cada fila recibida se cruza con tres columnas para dibujar los nueve estados de celda. */}
          {progreso.filas.map((pais, indiceFila) => (
            <div className="filaGrillaRival" key={indiceFila}>
              <strong>{pais}</strong>
              {[0, 1, 2].map((indiceColumna) => {
                const clave = `r${indiceFila}_c${indiceColumna}`;
                return <span key={clave}>{progreso.celdasReveladas?.[clave] ? "✓" : "?"}</span>;
              })}
            </div>
          ))}
          {typeof progreso.puntaje === "number" && <p>Puntaje: {progreso.puntaje}</p>}
        </div>
      )}

      {!progreso && expanded && <p>Cuando la otra persona avance, vas a ver su progreso actualizado acá.</p>}
    </aside>
  );
}
