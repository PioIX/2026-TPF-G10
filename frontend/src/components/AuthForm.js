"use client";

import Form, { Field } from "./Form";
import Button from "./Button";

// Formulario controlado de acceso y registro para la ruta de autenticación.
export default function AuthForm({
  modo = "login",
  onSubmit,
  onCambiarModo,
  nombre = "",
  onNombreChange,
  email = "",
  onEmailChange,
  password = "",
  onPasswordChange,
}) {
  const registro = modo === "registro";

  return (
    <>
      <Form className={registro ? "registro" : "login"} onSubmit={onSubmit}>
        {registro && (
          <Field
            label="Nombre de usuario"
            name="nombre"
            className="authField"
            hideLabel
            placeholder="NOMBRE DE USUARIO:"
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            required={false}
          />
        )}
        <Field
          label="Correo electrónico"
          name="email"
          type="email"
          className="authField"
          hideLabel
          placeholder="CORREO ELECTRÓNICO:"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required={false}
        />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          className="authField"
          hideLabel
          placeholder="CONTRASEÑA:"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required={false}
        />
        <Button type="submit">
          {registro ? "REGISTRARSE" : "INICIAR SESIÓN"}
        </Button>
        {!registro && (
          <Button
            type="button"
            className="btn-secundario"
            onClick={onCambiarModo}
          >
            REGISTRARSE
          </Button>
        )}
      </Form>
      {registro && (
        <Button
          type="button"
          className="btn-volver"
          onClick={onCambiarModo}
        >
          Volver al inicio de sesión
        </Button>
      )}
    </>
  );
}
