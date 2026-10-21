"use client";
// Entrada preparada para Adivina el jugador; la ruta actual dibuja el input de respuesta directamente.
import { useState } from "react";
import AutocompleteInput from "./AutocompleteInput";
import Button from "./Button";

export default function GuessBox({ opciones, onAdivinar, deshabilitado }) {
  // Conserva el texto del input y lo limpia al pedirle a la página que valide el intento.
  const [txt, setTxt] = useState("");
  const enviar = () => { if (txt.trim()) { onAdivinar(txt.trim()); setTxt(""); } };
  return (
    <div className="entrada">
      <AutocompleteInput opciones={opciones} valor={txt} onCambio={setTxt} onEnter={enviar} placeholder="Nombre del futbolista" />
      <Button onClick={enviar} disabled={deshabilitado}>🚩 Adivinar</Button>
    </div>
  );
}
