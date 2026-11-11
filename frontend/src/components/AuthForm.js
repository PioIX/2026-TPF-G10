"use client";

import Form, { Field } from "./Form";
import Button from "./Button";

// Formulario controlado de acceso y registro; comparte campos y acciones entre ambos modos.
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
  isLoading = false, // <-- 1. Agregamos la prop
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
            disabled={isLoading} // <-- 2. Bloqueamos el campo
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
          disabled={isLoading} // <-- 2. Bloqueamos el campo
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
          disabled={isLoading} // <-- 2. Bloqueamos el campo
        />
        <Button type="submit" disabled={isLoading}>
          {/* 3. Cambiamos el texto dinámicamente si está cargando */}
          {isLoading ? "CARGANDO..." : (registro ? "REGISTRARSE" : "INICIAR SESIÓN")}
        </Button>
        {!registro && (
          <Button
            type="button"
            className="btn-secundario"
            onClick={onCambiarModo}
            disabled={isLoading} // <-- 2. Bloqueamos el botón secundario
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
          disabled={isLoading} // <-- 2. Bloqueamos el botón de volver
        >
          Volver al inicio de sesión
        </Button>
      )}
    </>
  );
}
