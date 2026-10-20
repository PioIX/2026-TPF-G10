"use client"
import Link from "next/link";
import "./global.css";

export default function HomePage() {
  return (
    <main className="portada">
      <section className="portadaContenido" aria-labelledby="tituloPortada">
        <div className="portadaLogoMarco">
          <image src="/logo.png" alt="Escudo de Fulbo 11" />
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
