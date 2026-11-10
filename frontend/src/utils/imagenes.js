import { BACKEND_URL } from "../config/backend";

// Centraliza las búsquedas para que los juegos compartan una consulta en curso y
// una copia positiva de cada URL durante la sesión del navegador.
const cacheImagenes = new Map();
const consultasPendientes = new Map();

export default async function obtenerImagenDeportiva(tipo, nombre) {
  const nombreLimpio = String(nombre || "").trim();
  // Acepta las dos convenciones que ya existen en los componentes del proyecto.
  const tipoLimpio = tipo === "player" ? "jugador" : tipo === "team" ? "equipo" : tipo;
  if (!["jugador", "equipo"].includes(tipoLimpio) || !nombreLimpio) return "";

  // Normaliza tildes y signos para que variantes de escritura no repitan llamadas.
  const nombreNormalizado = nombreLimpio
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const clave = `${tipoLimpio}:${nombreNormalizado}`;
  if (cacheImagenes.has(clave)) return cacheImagenes.get(clave);
  if (consultasPendientes.has(clave)) return consultasPendientes.get(clave);

  const consulta = (async () => {
    // El límite evita que una llamada colgada deje el componente esperando para siempre.
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 10000);
    try {
      const parametros = new URLSearchParams({ tipo: tipoLimpio, nombre: nombreLimpio });
      const respuesta = await fetch(`${BACKEND_URL}/imagen?${parametros}`, {
        signal: controlador.signal,
      });
      if (!respuesta.ok) return "";

      const datos = await respuesta.json();
      const imagen = typeof datos?.imagen === "string" ? datos.imagen : "";
      // Solo conserva URLs encontradas; una falla temporal se puede volver a intentar.
      if (imagen) cacheImagenes.set(clave, imagen);
      return imagen;
    } catch {
      return "";
    } finally {
      clearTimeout(temporizador);
      consultasPendientes.delete(clave);
    }
  })();

  consultasPendientes.set(clave, consulta);
  return consulta;
}
