"use client";
import { useState } from "react";
import AutocompleteInput from "./AutocompleteInput";
import Button from "./Button";
import Message from "./Message";

export default function CellSearchPanel({
  fila,
  columna,
  opciones,
  cantidadValidas,
  onProbar,
  feedback,
  deshabilitado = false,
}) {
  const [txt, setTxt] = useState("");

  const probar = () => {
    if (txt.trim() && !deshabilitado) onProbar(txt.trim());
  };

  return (
    <div className="gridResultadosCelda">
      <h3>Celda ({fila + 1}, {columna + 1}) - {cantidadValidas} jugador(es)</h3>
      <div className="gridBusquedaCelda">
        <AutocompleteInput
          opciones={opciones}
          valor={txt}
          onCambio={setTxt}
          onEnter={probar}
          placeholder="Buscar jugador..."
          inputId="buscadorJugador"
          className="gridSearchInput"
          disabled={deshabilitado}
          ariaLabel="Buscar jugador para la celda"
        />
        <Button id="btnProbar" type="button" className="gridSearchButton" onClick={probar} disabled={deshabilitado}>
          Probar
        </Button>
      </div>
      {feedback && <Message className="gridFeedback" tipo={feedback.includes("Correcto") ? "ok" : "error"}>{feedback}</Message>}
    </div>
  );
}
