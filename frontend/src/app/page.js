// src/app/page.js
"use client";
import Link from "next/link";
import "./global.css";

export default function MenuPage() {
  return (
    <>
      {/* Tu compañero puede reemplazar este header por su componente <Title> */}
      <header>
        <h1>MENÚ - FULBO 11</h1>
        <Link href="/">
          <img src="public/logo.png" alt="Logo" />
        </Link>
      </header>
      <hr />

      <div className="juegos">
        <div className="card">
          <img src="public/fulbo11.png" alt="Fulbo 11" />
          <h3>Fulbo 11</h3>
          <Link href="/fulbo11">
            <button type="button">JUGAR</button>
          </Link>
        </div>

        <div className="card">
          <img src="public/wordle.png" alt="Wordle" />
          <h3>Wordle</h3>
          <Link href="/wordle">
            <button type="button">JUGAR</button>
          </Link>
        </div>

        <div className="card">
          <img src="public/grid.png" alt="Grid" />
          <h3>Grid</h3>
          <Link href="/grid">
            <button type="button">JUGAR</button>
          </Link>
        </div>

        <div className="card">
          <img src="public/adivinaeljugador.png" alt="Adivina el Jugador" />
          <h3>Adivina el Jugador</h3>
          <Link href="/adivinaeljugador">
            <button type="button">JUGAR</button>
          </Link>
        </div>
      </div>

      <div className="admin" style={{ gap: "15px" }}>
        <Link href="/login">
          <button type="button">Iniciar Sesión / Registro</button>
        </Link>
        <Link href="/admin">
          <button type="button">Panel de Admin</button>
        </Link>
      </div>
    </>
  );
}