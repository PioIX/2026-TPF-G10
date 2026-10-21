"use client";
// Teclado preparado para Wordle; la ruta activa genera sus teclas directamente en wordle/page.js.

const FILAS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

// usadas: { A: "ok" | "cerca" | "no" } para pintar las teclas
export default function Keyboard({ onTecla, usadas = {} }) {
  // Cada tecla delega su acción a onTecla; el padre conserva el estado y los colores ya descubiertos.
  return (
    <div className="teclado">
      {FILAS.map((fila, i) => (
        <div className="fila-k" key={i}>
          {i === 2 && <button className="tecla grande" onClick={() => onTecla("ENTER")}>ENTER</button>}
          {[...fila].map((l) => (
            <button key={l} className={`tecla ${usadas[l] || ""}`} onClick={() => onTecla(l)}>{l}</button>
          ))}
          {i === 2 && <button className="tecla grande" onClick={() => onTecla("BKSP")} aria-label="Borrar">⌫</button>}
        </div>
      ))}
    </div>
  );
}














































































































