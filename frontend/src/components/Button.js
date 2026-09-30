"use client"; // Necesario: este componente recibe un evento (onClick)

// Props: text es un dato; onClick es una función que llega desde el padre.
// No hay props de diseño para no mezclar CSS con el ejemplo de React.
export default function Button({ text, onClick }) {
  return (
    <button onClick={onClick}>
      {text}
    </button>
  );
}
