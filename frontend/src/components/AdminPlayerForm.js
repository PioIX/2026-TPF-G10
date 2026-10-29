"use client";
import { useState } from "react";
import Form, { Field } from "./Form";
import Button from "./Button";
import TrayectoriaFields from "./TrayectoriaFields";

const TRAYECTORIA_VACIA = () => [{ anio_ingreso: "", anio_traspaso: "" }];

// Formulario reutilizable para los datos que se guardan en las tablas del jugador.
export default function AdminPlayerForm({ onGuardar, mensaje = "" }) {
  const [trayectorias, setTrayectorias] = useState(TRAYECTORIA_VACIA);

  const guardar = async (valores, formulario) => {
    const guardado = await onGuardar({ ...valores, trayectorias }, formulario);
    if (guardado) {
      formulario.reset();
      setTrayectorias(TRAYECTORIA_VACIA());
    }
  };

  return (
    <Form id="form-jugador-completo" className="adminFormulario" onSubmit={guardar}>
      <fieldset className="adminFormSection">
        <legend>Jugador</legend>
        <Field label="Nombre" name="nombre" />
        <Field label="Apellido" name="apellido" />
        <Field label="País" name="pais" />
        <Field label="Posición" name="posicion" />
        <Field label="Liga actual" name="liga_actual" />
        <Field label="Dorsal equipo" name="dorsal_equipo" type="number" />
        <Field label="Dorsal selección" name="dorsal_seleccion" type="number" />
        <Field label="Valor de mercado" name="valor_mercado" type="number" />
        <Field label="ID del equipo" name="id_equipo" type="number" />
      </fieldset>
      <fieldset className="adminFormSection">
        <legend>Datos</legend>
        <Field label="Edad" name="edad" type="number" />
        <Field label="Altura (cm)" name="altura" type="number" />
        <Field label="Peso (kg)" name="peso" type="number" />
        <Field label="Pierna hábil" name="pierna_habil" />
      </fieldset>
      <fieldset className="adminFormSection">
        <legend>Estadísticas</legend>
        <Field label="Goles" name="goles" type="number" />
        <Field label="Asistencias" name="asistencias" type="number" />
        <Field label="Títulos equipo" name="titulos_equipo" type="number" />
        <Field label="Títulos selección" name="titulos_seleccion" type="number" />
        <Field label="Títulos individuales" name="titulos_individuales" type="number" />
      </fieldset>
      <TrayectoriaFields value={trayectorias} onChange={setTrayectorias} />
      <Button type="submit" className="adminBoton">Guardar jugador completo</Button>
      <p className="adminFormMensaje" role="status" aria-live="polite">{mensaje}</p>
    </Form>
  );
}
