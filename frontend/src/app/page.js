"use client"
import Link from "next/link";
import Image from "next/image";
import "./global.css";

// Presentación inicial: explica el proyecto y dirige al usuario al login.
export default function HomePage() {
  return (
    <main className="portada">
      <section className="portadaContenido" aria-labelledby="tituloPortada">
        <div className="portadaLogoMarco">
          <Image src="/logo.png" alt="Escudo de Fulbo 11" width={140} height={140} priority />
        </div>

        <p className="portadaEtiqueta">MINIJUEGOS DE FÚTBOL</p>
        <h2 id="tituloPortada">FULBO 11</h2>
        <p className="portadaDescripcion">
          Poné a prueba lo que sabés de fútbol. Elegí un desafío, jugá y competí
          con tus amigos.
        </p>

        <Link className="portadaBoton" href="/login">
          {/* La pelota gira como indicador visual del botón principal. */}
          <span className="portadaBotonPelota" aria-hidden="true">⚽</span>
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
