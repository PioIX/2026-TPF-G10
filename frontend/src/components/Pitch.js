"use client";
// Cancha reutilizable preparada para Fútbol 11; la ruta activa renderiza una variante propia.
// Los números son códigos de roles, no dorsales: 4 y 5 centrales; 6 mediocampista defensivo/central.

export const POSICIONES = [
  { numero: 7, nombre: "ED", grupo: "delanteros" }, { numero: 9, nombre: "DC", grupo: "delanteros" }, { numero: 11, nombre: "EI", grupo: "delanteros" },
  { numero: 8, nombre: "MC", grupo: "mediocampistas" }, { numero: 10, nombre: "MCO", grupo: "mediocampistas" }, { numero: 6, nombre: "MCD/MC", grupo: "mediocampistas" },
  { numero: 3, nombre: "LI", grupo: "defensas" }, { numero: 5, nombre: "DFC", grupo: "defensas" }, { numero: 4, nombre: "DFC", grupo: "defensas" }, { numero: 2, nombre: "LD", grupo: "defensas" },
  { numero: 1, nombre: "ARQ", grupo: "arquero" },
];

// equipo: array de 11 con { nombre } del jugador colocado o null.
// En Fulbo 11 primero se escribe el jugador y después se toca la posición.
export default function Pitch({ equipo, seleccion, onSeleccionar }) {
  // Agrupa las once posiciones por línea y delega la selección al padre mediante onSeleccionar.
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
