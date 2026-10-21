"use client";
// Cancha interactiva con las once posiciones y la formación actual.

export const POSICIONES = [
  { numero: 7, nombre: "ED", grupo: "delanteros" }, { numero: 9, nombre: "DC", grupo: "delanteros" }, { numero: 11, nombre: "EI", grupo: "delanteros" },
  { numero: 8, nombre: "MC", grupo: "mediocampistas" }, { numero: 10, nombre: "MCO", grupo: "mediocampistas" }, { numero: 5, nombre: "MCD", grupo: "mediocampistas" },
  { numero: 3, nombre: "LI", grupo: "defensas" }, { numero: 6, nombre: "DFC", grupo: "defensas" }, { numero: 4, nombre: "DFC", grupo: "defensas" }, { numero: 2, nombre: "LD", grupo: "defensas" },
  { numero: 1, nombre: "ARQ", grupo: "arquero" },
];

// equipo: array de 11 con { nombre } del jugador colocado o null.
// En Fulbo 11 primero se escribe el jugador y después se toca la posición.
export default function Pitch({ equipo, seleccion, onSeleccionar }) {
  return (
    <div className="cancha">
      {["delanteros", "mediocampistas", "defensas", "arquero"].map((g) => (
        <div key={g} className="fila-c">
          {POSICIONES.map((p, i) => p.grupo === g && (
            <button
              key={i}
              type="button"
              className={`slot ${equipo[i] ? "lleno" : ""} ${seleccion === i ? "sel" : ""}`}
              onClick={() => onSeleccionar(i)}
            >
              <strong className="slot-n">{p.numero} - {p.nombre}</strong>
              <span>{equipo[i] ? equipo[i].nombre : "Vacío"}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
