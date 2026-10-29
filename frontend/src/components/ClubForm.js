"use client";
import Form, { Field } from "./Form";
import Button from "./Button";

// Formulario de alta de clubes; usa los mismos campos y manejo de envío que el de jugadores.
export default function ClubForm({ onGuardar, mensaje = "" }) {
  const guardar = async (valores, formulario) => {
    const guardado = await onGuardar(valores, formulario);
    if (guardado) formulario.reset();
  };

  return (
    <Form id="form-clubes" className="adminFormulario" onSubmit={guardar}>
      <fieldset className="adminFormSection">
        <legend>Datos del club</legend>
        <Field label="Nombre del club" name="nombre_equipo" />
        <Field label="Año de creación" name="anio_creacion" type="number" />
        <Field label="Títulos nacionales" name="titulos_nacionales" type="number" />
        <Field label="Títulos internacionales" name="titulos_internacionales" type="number" />
        <Field label="Ciudad" name="ciudad" />
        <Field label="Presidente" name="presidente" />
        <Field label="DT actual" name="dt_actual" />
        <Field label="Apodo" name="apodo" />
        <Field label="Cantidad de socios" name="cantidad_socios" type="number" />
        <Field label="Estadio" name="estadio" />
      </fieldset>
      <Button type="submit" className="adminBoton">Guardar club</Button>
      <p className="adminFormMensaje" role="status" aria-live="polite">{mensaje}</p>
    </Form>
  );
}
