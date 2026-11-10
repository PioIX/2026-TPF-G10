import { BACKEND_URL } from "../config/backend";

// Centraliza las búsquedas para que los juegos compartan consultas y listas de imágenes
// durante la sesión del navegador; así una misma tarjeta no vuelve a consultar el backend.
// Guarda por nombre las listas de URLs ya consultadas durante la sesión del navegador.
const cacheImagenes = new Map();
// Comparte una promesa en curso para evitar consultas duplicadas simultáneas al backend.
const consultasPendientes = new Map();

// Devuelve todas las imágenes disponibles en orden de preferencia para que la interfaz
// pueda probar otra si la primera URL está rota o el servidor de imágenes no responde.
export async function obtenerImagenesDeportivas(tipo, nombre) {
  const nombreLimpio = String(nombre || "").trim();
  // Acepta las dos convenciones que ya existen en los componentes del proyecto.
  const tipoLimpio = tipo === "player" ? "jugador" : tipo === "team" ? "equipo" : tipo;
  if (!["jugador", "equipo"].includes(tipoLimpio) || !nombreLimpio) return [];

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
      if (!respuesta.ok) return [];

      const datos = await respuesta.json();
      // Admite la respuesta nueva con lista y la respuesta vieja que solo enviaba una URL.
      const imagenesRecibidas = Array.isArray(datos?.imagenes)
        ? datos.imagenes
        : [datos?.imagen];
      const imagenes = [...new Set(imagenesRecibidas.filter((imagen) => (
        typeof imagen === "string" && /^https?:\/\//i.test(imagen)
      )))];
      // Guarda solo aciertos para que un fallo temporal pueda recuperarse en otra llamada.
      if (imagenes.length) cacheImagenes.set(clave, imagenes);
      return imagenes;
    } catch {
      return [];
    } finally {
      clearTimeout(temporizador);
      consultasPendientes.delete(clave);
    }
  })();

  consultasPendientes.set(clave, consulta);
  return consulta;
}
