// src/app/login/page.js
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "../global.css";
import { BACKEND_URL } from "../../config/backend";

// Validación de interfaz: evita enviar un correo sin el formato básico esperado.
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validación de interfaz; el servidor también debe validar cualquier dato recibido.
function validatePassword(password) {
  return password.length >= 6;
}

export default function LoginPage() {
  const router = useRouter();

  // Estado que controla el Conditional Rendering:
  // false = muestra Login | true = muestra Registro
  const [esRegistro, setEsRegistro] = useState(false);

  // Estados de los inputs
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estado para mostrar mensajes de error o éxito
  const [modalInfo, setModalInfo] = useState({ titulo: "", mensaje: "" });

  // Guarda el ID devuelto por el login; Socket.IO lo manda al backend para buscar al usuario.
  const guardarUsuarioLocal = (usuario) => {
    localStorage.setItem("usuarioId", usuario.id);
    localStorage.setItem("usuarioNombre", usuario.name);
  };

  // Cambia el formulario visible y borra el mensaje de la operación anterior.
  const cambiarModo = () => {
    setEsRegistro((prev) => !prev);
    setModalInfo({ titulo: "", mensaje: "" });
  };

  // Envía email y contraseña por POST; el backend devuelve el usuario validado en la base.
  const loginUsuario = async (e) => {
    e.preventDefault();

    if (email.trim() === "" || password.trim() === "") {
      setModalInfo({
        titulo: "Error",
        mensaje: "Por favor, complete todos los campos.",
      });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      // Lee el JSON de respuesta tanto si el servidor acepta como si rechaza el acceso.
      const usuario = await response.json();
      if (response.ok) {
        setModalInfo({
          titulo: "Éxito",
          mensaje: "Inicio de sesión exitoso. Redirigiendo...",
        });
        guardarUsuarioLocal(usuario);

        setTimeout(() => {
          router.push("/menu");
        }, 2000);
      } else {
        setModalInfo({
          titulo: "Error",
          mensaje: usuario.error || "Correo o contraseña incorrectos.",
        });
      }
    } catch (error) {
      setModalInfo({
        titulo: "Error",
        mensaje: "Error al conectar con el servidor: " + error.message,
      });
    }
  };

  // Registra en la base y, si sale bien, hace login para obtener el ID validado del usuario.
  const registrarUsuario = async (e) => {
    e.preventDefault();

    if (nombre.trim() === "" || email.trim() === "" || password.trim() === "") {
      setModalInfo({
        titulo: "Error",
        mensaje: "Por favor, complete todos los campos.",
      });
      return;
    }

    if (!validateEmail(email)) {
      setModalInfo({
        titulo: "Error",
        mensaje: "Por favor, ingrese un correo electrónico válido.",
      });
      return;
    }

    if (!validatePassword(password)) {
      setModalInfo({
        titulo: "Error",
        mensaje: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre,
          name: nombre,
          email: email,
          password: password,
        }),
      });

      // Este endpoint responde texto plano; el endpoint /login posterior responde JSON.
      const msj = await response.text();

      if (msj === "El usuario ya existe") {
        setModalInfo({
          titulo: "Error",
          mensaje: "Este correo electrónico ya está registrado.",
        });
      } else if (msj === "Usuario registrado") {
        // El registro no inicia sesión automáticamente; se valida la cuenta con el mismo pedido de login.
        const respuestaLogin = await fetch(`${BACKEND_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const usuario = await respuestaLogin.json();

        if (!respuestaLogin.ok) {
          setModalInfo({ titulo: "Error", mensaje: usuario.error || "No se pudo iniciar la sesión." });
          return;
        }

        guardarUsuarioLocal(usuario);
        setModalInfo({
          titulo: "Éxito",
          mensaje: "Usuario registrado correctamente. Redirigiendo...",
        });
        setTimeout(() => {
          router.push("/menu");
        }, 2000);
      } else {
        setModalInfo({
          titulo: "Error",
          mensaje: msj,
        });
      }
    } catch (error) {
      setModalInfo({
        titulo: "Error",
        mensaje: "Error al conectar con el servidor: " + error.message,
      });
    }
  };

  return (
    <>
      <div className="contenedor-auth">
        <div className="authEncabezado">
          <h2>{esRegistro ? "Sumate al equipo" : "Qué bueno verte"}</h2>
          <p>{esRegistro ? "Creá tu cuenta y empezá a jugar." : "Iniciá sesión para entrar a los desafíos."}</p>
        </div>
        {/* CONDITIONAL RENDERING: Cambia la clase y la función onSubmit según el estado */}
        <form
          className={esRegistro ? "registro" : "login"}
          onSubmit={esRegistro ? registrarUsuario : loginUsuario}
        >
          {/* Solo se renderiza el input de Nombre si 'esRegistro' es true */}
          {esRegistro && (
            <input
              type="text"
              className="campo"
              placeholder="NOMBRE DE USUARIO:"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          )}

          <input
            type="email"
            className="campo"
            placeholder="CORREO ELECTRÓNICO:"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="campo"
            placeholder="CONTRASEÑA:"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Botón principal: cambia su texto según el modo */}
          <button type="submit" className="btn">
            {esRegistro ? "REGISTRARSE" : "INICIAR SESIÓN"}
          </button>

          {/* Si está en modo Login, el botón para ir a Registro va adentro de la tarjeta */}
          {!esRegistro && (
            <button
              type="button"
              className="btn btn-secundario"
              onClick={cambiarModo}
            >
              REGISTRARSE
            </button>
          )}
        </form>

        {/* Si está en modo Registro, el botón para volver al Login va afuera (como en tu diseño original) */}
        {esRegistro && (
          <button
            type="button"
            className="btn btn-volver"
            onClick={cambiarModo}
          >
            Volver al inicio de sesión
          </button>
        )}

        {/* Cartel de aviso / Modal reactivo */}
        {modalInfo.mensaje && (
          <div className="alerta-modal">
            <h4>{modalInfo.titulo}</h4>
            <p>{modalInfo.mensaje}</p>
            <button
              type="button"
              className="btn-cerrar-modal"
              onClick={() => setModalInfo({ titulo: "", mensaje: "" })}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </>
  );
}
