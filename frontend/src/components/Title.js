// Componente simple: no tiene eventos ni hooks, así que NO necesita "use client".
// Recibe la prop `text` y la muestra dentro de un <h2>.
export default function Title({ text }) {
  return <h2>{text}</h2>;
}
