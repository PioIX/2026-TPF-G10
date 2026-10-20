"use client";
// Campos dinámicos para cargar varios pasos de la trayectoria de un jugador.
import { useState } from "react";
import { Field } from "./Form";
import Button from "./Button";

// La trayectoria es la relación jugador-equipo (muchos a muchos): una fila por cada paso.
// Los names llevan el índice (anio_ingreso_0, anio_traspaso_0, ...).
export default function TrayectoriaFields() {
  const [filas, setFilas] = useState([0]);
  const [sig, setSig] = useState(1);
  return (
    <fieldset>
      <legend>Trayectoria</legend>
      <p className="vacio">Podés cargar una fila por cada equipo en el que pasó.</p>
      {filas.map((id) => (
        <div className="celda-trayectoria" key={id}>
          <Field label="Año de ingreso" name={`anio_ingreso_${id}`} type="number" />
          <Field label="Año de traspaso" name={`anio_traspaso_${id}`} type="number" />
          {filas.length > 1 && (
            <Button type="button" variant="ghost" onClick={() => setFilas(filas.filter((f) => f !== id))}>−</Button>
          )}
        </div>
      ))}
      <Button type="button" variant="ghost" onClick={() => { setFilas([...filas, sig]); setSig(sig + 1); }}>+ Agregar fila</Button>
    </fieldset>
  );
}
