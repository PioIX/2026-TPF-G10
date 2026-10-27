import { BACKEND_URL } from "../config/backend";

// Centraliza las búsquedas para que los juegos compartan resultados y errores de la API.
const cacheImagenes = new Map();
const consultasPendientes = new Map();

export default async function obtenerImagenDeportiva(tipo, nombre) {
  const nombreLimpio = String(nombre || "").trim();
  if (!["jugador", "equipo"].includes(tipo) || !nombreLimpio) return "";

  const clave = `${tipo}:${nombreLimpio.toLocaleLowerCase()}`;
  if (cacheImagenes.has(clave)) return cacheImagenes.get(clave);
  if (consultasPendientes.has(clave)) return consultasPendientes.get(clave);

  const consulta = (async () => {
    try {
      const parametros = new URLSearchParams({ tipo, nombre: nombreLimpio });
      const respuesta = await fetch(`${BACKEND_URL}/imagen?${parametros}`);
      if (!respuesta.ok) return "";

      const datos = await respuesta.json();
      const imagen = typeof datos?.imagen === "string" ? datos.imagen : "";
      cacheImagenes.set(clave, imagen);
      return imagen;
    } catch {
      return "";
    } finally {
      consultasPendientes.delete(clave);
    }
  })();

  consultasPendientes.set(clave, consulta);
  return consulta;
}
