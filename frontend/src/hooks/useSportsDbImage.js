import { useEffect, useState } from "react";
import obtenerImagenDeportiva from "../utils/imagenes";

// Hook reutilizable para consultar fotos y escudos a través del backend.
export default function useSportsDbImage(tipo, nombre) {
  const [imagen, setImagen] = useState("");

  useEffect(() => {
    let activo = true;
    setImagen("");
    const tipoImagen = tipo === "player" ? "jugador" : "equipo";

    obtenerImagenDeportiva(tipoImagen, nombre).then((resultado) => {
      if (activo) setImagen(resultado);
    });

    return () => {
      activo = false;
    };
  }, [tipo, nombre]);

  return imagen;
}
