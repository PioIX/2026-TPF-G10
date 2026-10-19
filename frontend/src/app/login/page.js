// src/app/login/page.js
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../global.css";

const API_URL = "http://localhost:4000";

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

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

  // Alterna entre Login y Registro limpiando los mensajes previos
  const cambiarModo = () => {
    setEsRegistro((prev) => !prev);
    setModalInfo({ titulo: "", mensaje: "" });
  };

  // --- LÓGICA DE LOGIN ---
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
      const response = await fetch(`${API_URL}/usuarios`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const usuarios = await response.json();

      // Verificamos password o contrasena según cómo esté llamada la columna en tu tabla Usuarios
      const usuarioEncontrado = usuarios.find(
        (u) =>
          u.email === email &&
          (u.password === password || u.contrasena === password)
      );

      if (usuarioEncontrado) {
        setModalInfo({
          titulo: "Éxito",
          mensaje: "Inicio de sesión exitoso. Redirigiendo...",
        });
        localStorage.setItem(
          "usuarioId",
          usuarioEncontrado.id_usuarios || usuarioEncontrado.id
        );
        localStorage.setItem("usuarioNombre", usuarioEncontrado.name);

        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setModalInfo({
          titulo: "Error",
          mensaje: "Correo o contraseña incorrectos.",
        });
      }
    } catch (error) {
      setModalInfo({
        titulo: "Error",
        mensaje: "Error al conectar con el servidor: " + error.message,
      });
    }
  };

  // --- LÓGICA DE REGISTRO ---
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
      const response = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre,
          name: nombre,
          email: email,
          password: password,
        }),
      });

      const msj = await response.text();

      if (msj === "El usuario ya existe") {
        setModalInfo({
          titulo: "Error",
          mensaje: "Este correo electrónico ya está registrado.",
        });
      } else if (msj === "Usuario registrado") {
        setModalInfo({
          titulo: "Éxito",
          mensaje: "Usuario registrado correctamente. Redirigiendo...",
        });
        setTimeout(() => {
          router.push("/");
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