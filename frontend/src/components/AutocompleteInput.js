"use client";
import { useId } from "react";

export default function AutocompleteInput({ opciones, valor, onCambio, onEnter, placeholder }) {
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
