"use client";

import SportsImage from "./SportsImage";

// Dibuja las posiciones y deja que la pantalla decida cuáles están disponibles para el país actual.
// Dibuja la cancha y sus posiciones; el juego padre decide cuáles se pueden seleccionar.
export default function Pitch({
  posiciones,
  equipo,
  seleccion,
  onSeleccionar,
  puedeSeleccionar,
}) {
  return (
    <div className="cancha">
      {/* El primer map crea las cuatro líneas; el segundo distribuye en cada línea los puestos que le pertenecen. */}
      {["delanteros", "mediocampistas", "defensas", "arquero"].map((grupo) => (
        <div key={grupo} className={`fila ${grupo}`} id={grupo}>
          {posiciones.map((posicion, indice) => {
            if (posicion.grupo !== grupo) return null;

            const asignado = equipo[indice];
            const disponible = puedeSeleccionar(posicion, indice);
            const bloqueado = Boolean(asignado) || !disponible;

            return (
              <button
                key={posicion.numero}
                type="button"
                className={`casillero ${seleccion === indice ? "casilleroSeleccionado" : ""} ${
                  asignado ? "casilleroOcupado ocupado" : ""
                } ${!asignado && !disponible ? "casilleroBloqueado" : ""}`}
                disabled={bloqueado}
                title={
                  !asignado && !disponible
                    ? `No hay jugadores disponibles de este país para ${posicion.nombre}.`
                    : undefined
                }
                onClick={() => onSeleccionar(indice)}
              >
                <strong>{posicion.numero} - {posicion.nombre}</strong>
                {asignado && (
                  // La foto acompaña el nombre ya validado; no interviene en la elección.
                  <SportsImage tipo="player" nombre={asignado.nombre} size={48} />
                )}
                <span>{asignado ? asignado.nombre : "Vacío"}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
