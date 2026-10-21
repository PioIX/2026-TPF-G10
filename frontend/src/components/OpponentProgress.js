"use client";

// Define el contador principal y su límite para cada minijuego.
const DETALLES_PROGRESO = {
  wordle: { campo: "intentosUsados", maximo: 6, unidad: "intentos" },
  adivinaeljugador: { campo: "preguntasUsadas", maximo: 10, unidad: "preguntas o intentos" },
  futbol11: { campo: "jugadoresColocados", maximo: 11, unidad: "posiciones" },
  grid: { campo: "celdasCompletadas", maximo: 9, unidad: "celdas" },
};

// Uso: GameLobby lo muestra en online. Dibuja el progreso público correspondiente al minijuego actual.
export default function OpponentProgress({ game, player, expanded = false, onClose, onExpand }) {
  const definicion = DETALLES_PROGRESO[game];
  const progreso = player && player.progress;
  const cantidad = definicion && progreso ? progreso[definicion.campo] : 0;
  const porcentaje = definicion
    ? Math.min(100, Math.round((cantidad / definicion.maximo) * 100))
    : 0;

  // Traduce el estado compartido a una frase fácil de leer.
  let estado = "Esperando el primer avance del rival...";
  if (progreso && progreso.terminado) {
    if (game === "wordle") estado = progreso.gano ? "Terminó: acertó" : "Terminó los intentos";
    else if (game === "adivinaeljugador") estado = progreso.adivino ? "Terminó: adivinó" : "Terminó sin adivinar";
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

      {/* Fútbol 11 muestra solo los jugadores que ya se ven en la cancha rival. */}
      {progreso && game === "futbol11" && Array.isArray(progreso.formacion) && (
        <div className="formacionRival">
          {progreso.paisActual && <p>País actual: {progreso.paisActual}</p>}
          {progreso.formacion.map((jugador, indice) => (
            <div key={indice}><strong>{indice + 1}.</strong> {jugador || "Vacío"}</div>
          ))}
        </div>
      )}

      {/* Grid comparte los encabezados y marca las celdas resueltas sin mostrar el nombre acertado. */}
      {progreso && game === "grid" && Array.isArray(progreso.filas) && Array.isArray(progreso.columnas) && (
        <div className="grillaRival">
          <div className="filaGrillaRival encabezadoGrillaRival">
            <strong>País / equipo</strong>
            {progreso.columnas.map((columna, indice) => <strong key={indice}>{columna}</strong>)}
          </div>
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
