"use client";
import { Field } from "./Form";
import Button from "./Button";

// Editor repetible de clubes y años de trayectoria, reutilizado por formularios administrativos.
export default function TrayectoriaFields({ value = [], onChange }) {
  const filas = value;

  const actualizarFila = (index, campo, valor) => {
    // map crea un arreglo nuevo: cambia la fila elegida y copia intactas las demás.
    onChange?.(filas.map((fila, i) => (i === index ? { ...fila, [campo]: valor } : fila)));
  };

  return (
    <fieldset className="adminFormSection adminTrayectoria">
      <legend>Trayectoria</legend>
      <p className="adminAyudaTrayectoria">Podés cargar una fila por cada equipo en el que pasó.</p>
      <div className="adminTrayectoriaFilas">
        {filas.map((fila, index) => (
          <div
            className={`celda-trayectoria${filas.length > 1 ? " celda-trayectoriaConAccion" : ""}`}
            key={index}
          >
            <Field
              label="Año de ingreso"
              name={`trayectoria_${index}_anio_ingreso`}
              type="number"
              value={fila.anio_ingreso}
              onChange={(e) => actualizarFila(index, "anio_ingreso", e.target.value)}
            />
            <Field
              label="Año de traspaso"
              name={`trayectoria_${index}_anio_traspaso`}
              type="number"
              value={fila.anio_traspaso}
              onChange={(e) => actualizarFila(index, "anio_traspaso", e.target.value)}
            />
            {/* filter crea una lista sin la trayectoria seleccionada para quitar. */}
            {filas.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                className="adminQuitarTrayectoria"
                aria-label={`Quitar trayectoria ${index + 1}`}
                onClick={() => onChange?.(filas.filter((_, i) => i !== index))}
              >
                −
              </Button>
            )}
          </div>
        ))}
      </div>
      {/* Spread copia las filas actuales y agrega al final una fila nueva vacía. */}
      <Button
        type="button"
        variant="ghost"
        className="adminAgregarTrayectoria"
        onClick={() => onChange?.([...filas, { anio_ingreso: "", anio_traspaso: "" }])}
      >
        + Agregar fila
      </Button>
    </fieldset>
  );
}
