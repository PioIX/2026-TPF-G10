"use client";
// Teclado en pantalla que comunica cada tecla a la lógica del Wordle.

const FILAS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

// usadas: { A: "ok" | "cerca" | "no" } para pintar las teclas
export default function Keyboard({ onTecla, usadas = {} }) {
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














































































































