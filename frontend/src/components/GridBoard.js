"use client";

import Image from "next/image";
import useSportsDbImage from "@/hooks/useSportsDbImage";

function EncabezadoEquipo({ equipo }) {
  const escudo = useSportsDbImage("team", equipo.nombre);

  return (
    <div className="cell logo">
      {escudo && (
        <Image
          src={escudo}
          alt=""
          width={40}
          height={40}
          unoptimized
          style={{ objectFit: "contain" }}
        />
      )}
      <span>{equipo.nombre}</span>
    </div>
  );
}

function CeldaJugador({ jugador, onClick }) {
  const foto = useSportsDbImage(
    "player",
    jugador ? `${jugador.nombre} ${jugador.apellido}` : ""
  );

  if (!jugador) {
    return (
      <button type="button" className="cell player clickable" onClick={onClick}>
        ?
      </button>
    );
  }

  return (
    <div className="cell player found">
      {foto && (
        <Image
          src={foto}
          alt=""
          width={60}
          height={60}
          unoptimized
          style={{ objectFit: "contain" }}
        />
      )}
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
