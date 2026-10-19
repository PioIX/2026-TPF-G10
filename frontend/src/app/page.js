// src/app/page.js
"use client";
import Link from "next/link";
import "./global.css";

export default function MenuPage() {
  return (
    <>
      <div className="juegos">
        <div className="card">
          <img src="/fulbo11.png" alt="Fulbo 11" />
          <h3>Fulbo 11</h3>
          <Link href="/fulbo11">
            <button type="button">JUGAR</button>
          </Link>
        </div>

        <div className="card">
          <img src="/wordle.png" alt="Wordle" />
          <h3>Wordle</h3>
          <Link href="/wordle">
            <button type="button">JUGAR</button>
          </Link>
        </div>

        <div className="card">
          <img src="/grid.png" alt="Grid" />
          <h3>Grid</h3>
          <Link href="/grid">
            <button type="button">JUGAR</button>
          </Link>
        </div>

        <div className="card">
          <img src="/adivinaeljugador.png" alt="Adivina el Jugador" />
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