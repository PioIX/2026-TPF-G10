"use client";

// Silueta reutilizable de jugador, usada en Adivina el jugador.
import { useEffect, useState } from "react";

// La foto queda oscurecida hasta que la partida indique que debe revelarse.
export default function PlayerSilhouette({
  imagen,
  revelado = false,
  id,
  size = 180,
}) {
  const [errorImagen, setErrorImagen] = useState(false);

  useEffect(() => {
    setErrorImagen(false);
  }, [imagen]);

  return (
    <div id={id} className="silueta">
      {imagen && !errorImagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagen}
          alt=""
          width={size}
          height={size}
          onError={() => setErrorImagen(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: revelado ? "none" : "brightness(0)",
          }}
        />
      ) : "?"}
    </div>
  );
}
