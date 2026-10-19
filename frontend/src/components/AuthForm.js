"use client";
import Form, { Field } from "./Form";
import Button from "./Button";

// modo "login" pide email + contraseña; "registro" suma el nombre de usuario.
export default function AuthForm({ modo = "login", onSubmit }) {
  const registro = modo === "registro";
  return (
    <Form onSubmit={onSubmit}>
      {registro && <Field label="Nombre de usuario" name="nombre" />}
      <Field label="Correo electrónico" name="email" type="email" />
      <Field label="Contraseña" name="password" type="password" minLength={6} />
      <Button type="submit">{registro ? "Registrarse" : "Iniciar sesión"}</Button>
      <Button href={registro ? "/login" : "/registro"} variant="ghost">
        {registro ? "Volver al inicio de sesión" : "Crear cuenta"}
      </Button>
    </Form>
  );
}
