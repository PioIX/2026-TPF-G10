// Sección de comentarios futboleros: frases cortas para celebrar respuestas correctas.
// Frases separadas por tipo de jugada para variar los mensajes de respuesta de los juegos.
const FRASES = {
  colocacion: [
    "¡Qué pase!",
    "¡La puso al pie!",
    "¡Bien leído!",
    "¡La dejó servida!",
  ],
  acierto: [
    "¡Al ángulo!",
    "¡La clavaste!",
    "¡Qué definición!",
    "¡Golazo!",
  ],
  victoria: [
    "¡Partidazo!",
    "¡Qué manera de cerrar!",
    "¡La tribuna se viene abajo!",
  ],
};

// Devuelve una frase al azar; usa la categoría solicitada y cae en "acierto" si no existe.
// Elige al azar una frase de la categoría pedida; usa acierto si no existe esa categoría.
export function comentarioFutbolero(categoria = "acierto") {
  const opciones = FRASES[categoria] || FRASES.acierto;
  return opciones[Math.floor(Math.random() * opciones.length)];
}
