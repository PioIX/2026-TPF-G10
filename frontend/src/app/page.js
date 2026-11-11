"use client"
// Ruta inicial de Next.js. No consulta datos: presenta el juego y enlaza con el acceso.
import Link from "next/link";
import Image from "next/image";
import "./global.css";

// Uso: se muestra en /. El enlace de Next cambia de ruta sin recargar toda la página.
export default function HomePage() {
  return (
    <main className="portada">
      <section className="portadaContenido" aria-labelledby="tituloPortada">
        <div className="portadaPresentacion">
          <div className="portadaLogoMarco">
            <Image src="/logo.png" alt="Escudo de Fulbo 11" width={140} height={140} priority />
          </div>

          <p className="portadaEtiqueta">MINIJUEGOS DE FÚTBOL</p>
          <h2 id="tituloPortada"><span>FULBO</span> <span className="portadaNumero">11</span></h2>
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
        </div>

        {/* Este panel anticipa los seis juegos disponibles antes de iniciar sesión. */}
        <section className="portadaJuegosPanel" aria-labelledby="tituloJuegosDisponibles">
          <p className="portadaJuegosEtiqueta">ELEGÍ TU PRÓXIMO DESAFÍO</p>
          <h3 id="tituloJuegosDisponibles">Juegos disponibles</h3>
          <div className="portadaJuegos">
            <span><i aria-hidden="true">🏟️</i> Fútbol 11</span>
            <span><i aria-hidden="true">🔤</i> Wordle</span>
            <span><i aria-hidden="true">🧩</i> Grid</span>
            <span><i aria-hidden="true">🕵️</i> Adivina el jugador</span>
            <span><i aria-hidden="true">🔗</i> Link</span>
            <span><i aria-hidden="true">⚖️</i> ¿Quién tiene más?</span>
          </div>
          <p className="portadaJuegosNota">Seis formas de demostrar cuánto sabés de fútbol.</p>
        </section>
      </section>
    </main>
  );
}
