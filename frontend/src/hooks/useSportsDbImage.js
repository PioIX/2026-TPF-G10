import { useEffect, useState } from "react";
import { obtenerImagenesDeportivas } from "../utils/imagenes";

// Hook reutilizable que devuelve las URLs candidatas de TheSportsDB en orden de preferencia.
// Consulta la lista de imágenes y evita mostrar durante un render resultados de otra persona/equipo.
export default function useSportsDbImage(tipo, nombre) {
  // Guarda junto a la respuesta el nombre que la generó para no mostrar una foto vieja
  // durante el render en que cambia el jugador o el equipo consultado.
  const [resultado, setResultado] = useState({ clave: "", imagenes: [] });
  const clave = `${tipo}:${nombre || ""}`;

  useEffect(() => {
    let activo = true;
    const tipoImagen = tipo === "player" ? "jugador" : "equipo";

    obtenerImagenesDeportivas(tipoImagen, nombre).then((resultados) => {
      if (activo) setResultado({ clave, imagenes: resultados });
    });

    return () => {
      activo = false;
    };
  }, [tipo, nombre, clave]);

  // Mientras llega la consulta nueva devuelve vacío, no la foto de la identidad anterior.
  return resultado.clave === clave ? resultado.imagenes : [];
}
