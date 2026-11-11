"use client";

import { useState } from "react";
import Image from "next/image";
import useSportsDbImage from "../hooks/useSportsDbImage";

// Imagen reutilizable para todos los juegos. Prueba cada URL recibida del backend en orden;
// si todas fallan o faltan en el catálogo, deja un marcador legible en el mismo espacio.
// Presenta una foto o escudo y prueba otras URLs si la imagen principal no carga.
export default function SportsImage({ tipo, nombre, alt = "", size = 56, className = "" }) {
  // El hook normaliza player/team y comparte la lista de posibles imágenes entre pantallas.
  const imagenes = useSportsDbImage(tipo, nombre);
  // Conserva las URLs fallidas para avanzar a otra alternativa, en vez de abandonar al primer error.
  const [urlsFallidas, setUrlsFallidas] = useState([]);
  // find elige la primera URL que no figure en el arreglo de fallidas.
  const imagen = imagenes.find((url) => !urlsFallidas.includes(url));

  return (
    <span
      className={`imagenDeportiva ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden={alt ? undefined : "true"}
    >
      {imagen ? (
        <Image
          src={imagen}
          alt={alt}
          width={size}
          height={size}
          unoptimized
          onError={() => setUrlsFallidas((anteriores) => [...anteriores, imagen])}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <span className="imagenDeportivaVacia" aria-label={alt ? `Sin imagen: ${alt}` : undefined}>⚽</span>
      )}
    </span>
  );
}
