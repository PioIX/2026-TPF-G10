"use client";
// Formulario con los campos de alta de un club.
import Form, { Field } from "./Form";
import Button from "./Button";

export default function ClubForm({ onGuardar }) {
  return (
    <Form onSubmit={onGuardar}>
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
      <Button type="submit">Guardar club</Button>
    </Form>
  );
}
