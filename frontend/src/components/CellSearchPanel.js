//CellSearchPanel es el panel que aparece debajo de la grilla del juego Grid cuando tocás una celda, para que busques y pruebes al jugador que va ahí.
//es el panel que aparece debajo de la grilla del juego Grid cuando tocás una celda, para que busques y pruebes al jugador que va ahí.
"use client";
// Panel de búsqueda para responder una celda seleccionada del Grid.
import { useState } from "react";
import AutocompleteInput from "./AutocompleteInput";
import Button from "./Button";
import Message from "./Message";

// Panel que aparece debajo del Grid al tocar una celda (reemplaza a #results).
// opciones: nombres completos de los jugadores válidos para esa celda.
export default function CellSearchPanel({ fila, columna, opciones, onProbar, feedback }) {
  const [txt, setTxt] = useState("");
  const probar = () => onProbar(txt);
  return (
    <div className="results">
      <h3>Celda ({fila + 1}, {columna + 1}) - {opciones.length} jugador(es)</h3>
      <div className="entrada">
        <AutocompleteInput opciones={opciones} valor={txt} onCambio={setTxt} onEnter={probar} placeholder="Buscar jugador..." />
        <Button onClick={probar}>Probar</Button>
      </div>
      {feedback && <Message tipo={feedback === "Correcto" ? "ok" : "error"}>{feedback}</Message>}
    </div>
  );
}
