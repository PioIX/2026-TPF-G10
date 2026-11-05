"use client";

const FILAS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

// usadas: { A: "ok" | "cerca" | "no" } para pintar las teclas
export default function Keyboard({ onTecla, usadas = {} }) {
  // Cada tecla delega su acción a onTecla; el padre conserva el estado y los colores ya descubiertos.
  return (
    <div id="teclado">
      {FILAS.map((fila, i) => (
        <div className="fila-teclado" key={i}>
          {i === 2 && (
            <button className="tecla grande" type="button" onClick={() => onTecla("ENTER")}>
              ENTER
            </button>
          )}
          {[...fila].map((letra) => (
            <button
              key={letra}
              type="button"
              className={`tecla ${usadas[letra] || ""}`}
              onClick={() => onTecla(letra)}
            >
              {letra}
            </button>
          ))}
          {i === 2 && (
            <button
              className="tecla grande"
              type="button"
              onClick={() => onTecla("BKSP")}
              aria-label="Borrar"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  );
}














































































































