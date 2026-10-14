// src/app/registro/page.js
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

export default function RegistroPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalInfo, setModalInfo] = useState({ titulo: "", mensaje: "" });

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombre, // Requerido por backend/index.js
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
          router.push("/"); // Redirige al menú principal
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
      console.error("Error:", error);
    }
  };

  return (
    <>
      {/* Tu compañero puede reemplazar este header por su componente <Title> */}
      <header>
        <h1>REGISTRO - FULBO 11</h1>
        <Link href="/">
          <img src="/img/logo.png" alt="Logo" />
        </Link>
      </header>
      <hr />

      <div className="contenedor-auth">
        {/* Tu compañero puede reemplazar el form por su componente <Form> */}
        <form className="registro" onSubmit={registrarUsuario}>
          <input
            type="text"
            className="campo"
            placeholder="NOMBRE DE USUARIO:"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
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

          {/* Tu compañero puede reemplazar el botón por su componente <Button> */}
          <button className="btn" type="submit">
            REGISTRARSE
          </button>
        </form>

        <Link href="/login" className="btn btn-volver">
          Volver al inicio de sesión
        </Link>

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