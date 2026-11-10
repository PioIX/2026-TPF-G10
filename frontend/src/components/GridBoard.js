"use client";

import SportsImage from "./SportsImage";

function EncabezadoEquipo({ equipo }) {
  // El nombre del equipo se busca en la base de logos de TheSportsDB.
  return (
    <div className="cell logo">
      <SportsImage tipo="team" nombre={equipo.nombre} size={40} />
      <span>{equipo.nombre}</span>
    </div>
  );
}

function CeldaJugador({ jugador, onClick }) {
  if (!jugador) {
    return (
      <button type="button" className="cell player clickable" onClick={onClick}>
        ?
      </button>
    );
  }

  return (
    <div className="cell player found">
      {/* La foto se busca después de que la celda ya reveló un jugador válido. */}
      <SportsImage tipo="player" nombre={`${jugador.nombre} ${jugador.apellido}`} size={60} />
      <strong>{jugador.apellido}</strong>
    </div>
  );
}

// La pantalla conserva la lógica de respuestas; el tablero muestra imágenes y delega los clics.
export default function GridBoard({ grilla, celdasReveladas, onCelda }) {
  if (!grilla) return null;

  return (
    <div className="grid">
      <div className="cell logo title">
        FULBO11
        <br />
        GRID
      </div>
      {grilla.columnas.map((equipo, indice) => (
        <EncabezadoEquipo key={`${equipo.id}-${indice}`} equipo={equipo} />
      ))}
      {grilla.filas.map((pais, fila) => (
        <div key={`${pais.nombre}-${fila}`} style={{ display: "contents" }}>
          <div className="cell logo">{pais.nombre}</div>
          {grilla.columnas.map((_, columna) => {
            const clave = `r${fila}_c${columna}`;
            return (
              <CeldaJugador
                key={clave}
                jugador={celdasReveladas[clave]}
                onClick={() => onCelda(fila, columna)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
