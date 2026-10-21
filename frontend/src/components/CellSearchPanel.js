// Panel preparado para el Grid: la página actual todavía tiene el buscador dentro de grid/page.js.
"use client";
// Panel de búsqueda para responder una celda seleccionada del Grid.
import { useState } from "react";
import AutocompleteInput from "./AutocompleteInput";
import Button from "./Button";
import Message from "./Message";

// Si se integra, muestra la celda activa, su lista de respuestas válidas y el resultado del intento.
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
