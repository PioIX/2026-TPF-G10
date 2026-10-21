// Campo controlado con sugerencias HTML nativas. Se usa dentro de CellSearchPanel y GuessBox.

"use client";
// Input con sugerencias y envío opcional al presionar Enter.
import { useId } from "react";

export default function AutocompleteInput({ opciones, valor, onCambio, onEnter, placeholder }) {
  // useId genera un id estable y único para enlazar el input con su datalist.
  const id = useId();
  return (
    <>
      <input
        className="campo"
        list={id}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onCambio(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      />
      <datalist id={id}>
        {opciones.map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}
