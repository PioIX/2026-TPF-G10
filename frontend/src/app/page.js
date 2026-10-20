<<<<<<< Updated upstream
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
=======
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="portada">
      <section className="portadaContenido" aria-labelledby="tituloPortada">
        <div className="portadaLogoMarco">
          <img src="/logo.png" alt="Escudo de Fulbo 11" />
        </div>

        <p className="portadaEtiqueta">MINIJUEGOS DE FÚTBOL</p>
        <h2 id="tituloPortada">FULBO 11</h2>
        <p className="portadaDescripcion">
          Poné a prueba lo que sabés de fútbol. Elegí un desafío, jugá y competí
          con tus amigos.
        </p>

        <Link className="portadaBoton" href="/login">
          JUGAR
        </Link>
        <p className="portadaAyuda">
          Iniciá sesión o creá una cuenta para entrar al menú.
        </p>

        <div className="portadaJuegos" aria-label="Juegos disponibles">
          <span>Fútbol 11</span>
          <span>Wordle</span>
          <span>Adivina el jugador</span>
          <span>Grid</span>
        </div>
      </section>
    </main>
  );
}
>>>>>>> Stashed changes
