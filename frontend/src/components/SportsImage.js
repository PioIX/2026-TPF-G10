"use client";

import { useState } from "react";
import Image from "next/image";
import useSportsDbImage from "../hooks/useSportsDbImage";

// Imagen reutilizable para todos los juegos: si TheSportsDB no tiene el dato,
// el espacio conserva un marcador legible y nunca rompe la tarjeta o la cancha.
export default function SportsImage({ tipo, nombre, alt = "", size = 56, className = "" }) {
  // El hook resuelve alias player/team, comparte consultas y actualiza al cambiar el nombre.
  const imagen = useSportsDbImage(tipo, nombre);
  // Un enlace que dejó de funcionar se trata igual que una imagen ausente en la API.
  // Guarda la URL que falló; otra búsqueda puede mostrar normalmente otra URL.
  const [urlFallida, setUrlFallida] = useState("");

  return (
    <span
      className={`imagenDeportiva ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden={alt ? undefined : "true"}
    >
      {imagen && imagen !== urlFallida ? (
        <Image
          src={imagen}
          alt={alt}
          width={size}
          height={size}
          unoptimized
          onError={() => setUrlFallida(imagen)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <span className="imagenDeportivaVacia" aria-label={alt ? `Sin imagen: ${alt}` : undefined}>⚽</span>
      )}
    </span>
  );
}
