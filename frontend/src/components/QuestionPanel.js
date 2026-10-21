"use client";
// Panel preparado para Adivina el jugador; la ruta activa contiene estos controles directamente.
import Button from "./Button";

const CATEGORIAS = ["Club", "País", "Posición", "Edad", "Altura"];
const COMPARADORES = ["Mayor que", "Menor que", "Exactamente"];

export default function QuestionPanel({
  categoria, onCategoria, periodo, onPeriodo, comparador, onComparador,
  valor, onValor, texto, onTexto, opciones, onPreguntar, restantes, deshabilitado,
}) {
  // Edad/altura usan comparador y slider; las categorías de texto muestran sugerencias.
  const numerica = categoria === "Edad" || categoria === "Altura";
  return (
    <div className="preguntas">
      <p>Hacé preguntas eligiendo una categoría:</p>
      <div className="fila-botones">
        {["Actual", "Pasado"].map((p) => (
          <button key={p} className={`pill ${periodo === p ? "on" : ""}`} onClick={() => onPeriodo(p)}>{p}</button>
        ))}
      </div>
      <div className="fila-botones">
        {CATEGORIAS.map((c) => (
          <button key={c} className={`pill ${categoria === c ? "on" : ""}`} onClick={() => onCategoria(c)}>{c}</button>
        ))}
      </div>
      {numerica && (
        <>
          <div className="fila-botones">
            {COMPARADORES.map((c) => (
              <button key={c} className={`pill ${comparador === c ? "on" : ""}`} onClick={() => onComparador(c)}>{c}</button>
            ))}
          </div>
          <label className="slider">
            <input type="range" min={categoria === "Edad" ? 16 : 150} max={categoria === "Edad" ? 45 : 210}
              value={valor} onChange={(e) => onValor(Number(e.target.value))} />
            <span>{valor} {categoria === "Edad" ? "años" : "cm"}</span>
          </label>
        </>
      )}
      <input className="campo" list="sug-preguntas" value={texto} disabled={numerica || !categoria}
        placeholder={numerica ? "Usá el slider numérico" : categoria ? "Seleccioná o escribí acá" : "Elegí una categoría"}
        onChange={(e) => onTexto(e.target.value)} />
      <datalist id="sug-preguntas">{(numerica ? [] : opciones).map((o) => <option key={o} value={o} />)}</datalist>
      <Button onClick={onPreguntar} disabled={deshabilitado}>Hacer pregunta</Button>
      <p className="restantes">Te quedan {restantes} preguntas.</p>
    </div>
  );
}
