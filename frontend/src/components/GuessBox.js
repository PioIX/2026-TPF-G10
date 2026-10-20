"use client";
// Entrada con autocompletado para enviar una adivinanza.
import { useState } from "react";
import AutocompleteInput from "./AutocompleteInput";
import Button from "./Button";

export default function GuessBox({ opciones, onAdivinar, deshabilitado }) {
  const [txt, setTxt] = useState("");
  const enviar = () => { if (txt.trim()) { onAdivinar(txt.trim()); setTxt(""); } };
  return (
    <div className="entrada">
      <AutocompleteInput opciones={opciones} valor={txt} onCambio={setTxt} onEnter={enviar} placeholder="Nombre del futbolista" />
      <Button onClick={enviar} disabled={deshabilitado}>🚩 Adivinar</Button>
    </div>
  );
}
