"use client";
// Controles reutilizables para preguntas en Adivina el jugador.
import Button from "./Button";
import AutocompleteInput from "./AutocompleteInput";

const CATEGORIAS = [
  { id: "club", label: "Club" },
  { id: "liga", label: "Liga actual" },
  { id: "pais", label: "País" },
  { id: "posicion", label: "Posición" },
  { id: "edad", label: "Edad" },
  { id: "altura", label: "Altura" },
];
const COMPARADORES = [
  { id: "mayor", label: "Mayor que" },
  { id: "menor", label: "Menor que" },
  { id: "exactamente", label: "Exactamente" },
];

export default function QuestionPanel({
  categoria, onCategoria, periodo, onPeriodo, comparador, onComparador,
  valor, onValor, texto, onTexto, opciones, onPreguntar, restantes, deshabilitado,
}) {
  const numerica = categoria === "edad" || categoria === "altura";
  const minimo = categoria === "edad" ? 16 : 150;
  const maximo = categoria === "edad" ? 45 : 210;
  const preguntar = () => {
    if (!deshabilitado) onPreguntar();
  };

  return (
    <div id="caja-preguntas">
      <p id="titulo-preguntas">Haz preguntas haciendo clic abajo:</p>
      {categoria === "club" && (
        <div className="fila-botones">
          <div id="grupo-botones-1">
            {[{ id: "actual", label: "Actual" }, { id: "pasado", label: "Pasado" }].map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                className={`btn-pill ${periodo === opcion.id ? "selected" : ""}`}
                onClick={() => onPeriodo(opcion.id)}
              >
                {opcion.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="fila-botones">
        <div id="grupo-botones-2">
          {CATEGORIAS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`btn-pill ${categoria === id ? "selected" : ""}`}
              onClick={() => onCategoria(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {numerica && (
        <div id="comparador">
          <div className="fila-botones">
            {COMPARADORES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`btn-pill ${comparador === id ? "selected" : ""}`}
                onClick={() => onComparador(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div id="slider-contenedor">
            <input
              type="range"
              id="input-rango"
              min={minimo}
              max={maximo}
              value={valor}
              onChange={(e) => onValor(Number(e.target.value))}
            />
            <span id="valor-rango">{valor} {categoria === "edad" ? "años" : "cm"}</span>
          </div>
        </div>
      )}
      <div className="fila-input-preguntar">
        <AutocompleteInput
          opciones={numerica ? [] : opciones}
          valor={texto}
          onCambio={onTexto}
          onEnter={preguntar}
          placeholder={numerica ? "Usa el selector numérico" : categoria ? "Selecciona o escribe aquí" : "Elige una categoría"}
          inputId="input-texto"
          className="input-pill"
          disabled={numerica || !categoria}
          ariaLabel="Respuesta para la pregunta"
        />
        <Button
          id="btn-preguntar"
          type="button"
          className="btn-accion"
          onClick={preguntar}
          disabled={deshabilitado}
        >
          Hacer pregunta
        </Button>
      </div>
      <p id="preguntas-restantes">Tienes {restantes} preguntas restantes:</p>
    </div>
  );
}
