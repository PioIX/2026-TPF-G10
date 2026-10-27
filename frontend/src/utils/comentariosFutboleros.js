// Sección de comentarios futboleros: frases cortas para celebrar respuestas correctas.
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
export function comentarioFutbolero(categoria = "acierto") {
  const opciones = FRASES[categoria] || FRASES.acierto;
  return opciones[Math.floor(Math.random() * opciones.length)];
}
