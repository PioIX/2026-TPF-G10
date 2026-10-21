"use client";
// Formulario que agrupa los datos principales, estadísticas y trayectoria de un jugador.
import Form, { Field } from "./Form";
import Button from "./Button";
import TrayectoriaFields from "./TrayectoriaFields";

// onGuardar recibe todos los campos planos; en la página se separan en
// jugador / datos / estadisticas / trayectoria antes de llamar a la API.

//El panel de admin, que permite agregar jugadores personalizados o si falta algun jugador en nuestra base de datos, aclarando cada detalle de cada jugador
export default function AdminPlayerForm({ onGuardar }) {
  return (
    <Form onSubmit={onGuardar}>
      <fieldset>
        <legend>Jugador</legend>
        <Field label="Nombre" name="nombre" />
        <Field label="Apellido" name="apellido" />
        <Field label="País" name="pais" />
        <Field label="Posición" name="posicion" />
        <Field label="Dorsal equipo" name="dorsal_equipo" type="number" />
        <Field label="Dorsal selección" name="dorsal_seleccion" type="number" />
        <Field label="Valor de mercado" name="valor_mercado" type="number" />
        <Field label="ID del equipo" name="id_equipo" type="number" />
      </fieldset>
      <fieldset>
        <legend>Datos</legend>
        <Field label="Edad" name="edad" type="number" />
        <Field label="Altura (cm)" name="altura" type="number" />
        <Field label="Peso (kg)" name="peso" type="number" />
        <Field label="Pierna hábil" name="pierna_habil" />
      </fieldset>
      <fieldset>
        <legend>Estadísticas</legend>
        <Field label="Goles" name="goles" type="number" />
        <Field label="Asistencias" name="asistencias" type="number" />
        <Field label="Títulos equipo" name="titulos_equipo" type="number" />
        <Field label="Títulos selección" name="titulos_seleccion" type="number" />
        <Field label="Títulos individuales" name="titulos_individuales" type="number" />
      </fieldset>
      <TrayectoriaFields />
      <Button type="submit">Guardar jugador completo</Button>
    </Form>
  );
}
