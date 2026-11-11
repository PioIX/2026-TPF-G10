"use client";

// Silueta reutilizable de jugador, usada en Adivina el jugador.
import { useState } from "react";

// La foto queda oscurecida hasta que la partida indique que debe revelarse.
// Muestra la imagen del jugador oculta hasta que el juego autoriza revelarla.
export default function PlayerSilhouette({
  imagen,
  imagenes = [],
  revelado = false,
  id,
  size = 180,
}) {
  // Junta la URL antigua y las alternativas nuevas para mantener compatible el componente.
  // filter(Boolean) elimina URLs vacías y Set impide probar dos veces la misma dirección.
  const candidatas = [...new Set([imagen, ...imagenes].filter(Boolean))];
  // Si falla una imagen, guarda su URL y prueba la próxima alternativa del mismo jugador.
  const [urlsFallidas, setUrlsFallidas] = useState([]);
  const imagenActual = candidatas.find((url) => !urlsFallidas.includes(url));

  return (
    <div id={id} className="silueta">
      {imagenActual ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagenActual}
          alt=""
          width={size}
          height={size}
          onError={() => setUrlsFallidas((anteriores) => [...anteriores, imagenActual])}
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
