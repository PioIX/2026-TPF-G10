"use client";

import Link from "next/link";
import Image from "next/image";
import GlobalChat from "../../components/GlobalChat";

// Menú principal: permite elegir uno de los juegos y muestra el chat global.
export default function MenuPage() {
  return (
    <>
      <div className="menuConChat">
        <div className="juegos">
          <div className="card">
            <Image src="/fulbo11.png" alt="Fulbo 11" width={240} height={140} />
            <h3>Fulbo 11</h3>
            <Link href="/fulbo11">
              <button type="button">JUGAR</button>
            </Link>
          </div>

          <div className="card">
            <Image src="/wordle.png" alt="Wordle" width={240} height={140} />
            <h3>Wordle</h3>
            <Link href="/wordle">
              <button type="button">JUGAR</button>
            </Link>
          </div>

          <div className="card">
            <Image src="/grid.png" alt="Grid" width={240} height={140} />
            <h3>Grid</h3>
            <Link href="/grid">
              <button type="button">JUGAR</button>
            </Link>
          </div>

          <div className="card">
            <Image src="/adivinaeljugador.png" alt="Adivina el Jugador" width={240} height={140} />
            <h3>Adivina el Jugador</h3>
            <Link href="/adivinaeljugador">
              <button type="button">JUGAR</button>
            </Link>
          </div>
        </div>

        <GlobalChat />
      </div>

      <div className="admin menuAcciones">
        <Link href="/">
          <button type="button">Volver al inicio</button>
        </Link>
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
