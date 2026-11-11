"use client";

import { useState } from "react";
import Image from "next/image";

// Prueba cada foto del compañero, en vez de dejar un icono roto si la primera URL falla.
// Prueba las URLs de un compañero y muestra un balón si no hay ninguna imagen utilizable.
function FotoCompanero({ imagenes, nombre }) {
  const [urlsFallidas, setUrlsFallidas] = useState([]);
  // find devuelve la primera URL todavía no fallida; si no hay, se usa el balón de respaldo.
  const imagen = imagenes.find((url) => !urlsFallidas.includes(url));

  if (!imagen) {
    return <span className="galeriaCompaneroVacio" aria-label={`Sin foto de ${nombre}`}>⚽</span>;
  }

  return (
    <Image
      src={imagen}
      alt=""
      width={96}
      height={96}
      unoptimized
      onError={() => setUrlsFallidas((anteriores) => [...anteriores, imagen])}
    />
  );
}

// Presenta la pista como una galería de compañeros dentro de Adivina el jugador,
// sin imitar el tablero ni la tarjeta del juego Link.
// Reúne las tarjetas de compañeros que se revelan como pista en Adivina el jugador.
export default function CompanerosGallery({ companeros }) {
  return (
    <section className="galeriaCompanerosPista" aria-label="Pista de compañeros de equipo">
      <h3>Una pista más: compartió equipo con</h3>
      <div className="galeriaCompanerosLista">
        {companeros.map((companero, indice) => (
          <figure className="galeriaCompanero" key={`${companero.nombre}-${indice}`}>
            <FotoCompanero imagenes={companero.imagenes || [companero.imagen].filter(Boolean)} nombre={companero.nombre} />
            <figcaption>{companero.nombre}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
