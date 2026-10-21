//“ClubForm es el formulario de alta de clubes del panel de administración. Está armado con Form y Field, así que no maneja estados por cada input: al enviar, Form junta todos los valores en un objeto y se lo entrega a la función onGuardar. Los names de los campos coinciden con las columnas de la tabla de equipos.”
//ClubForm es el formulario para dar de alta un club de fútbol (equipo) en la base de datos,estan en el panel de admin.
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
