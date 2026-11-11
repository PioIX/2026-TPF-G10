// Campo controlado con sugerencias HTML nativas, usado por los formularios de respuesta.

"use client";
// Input con sugerencias y envío opcional al presionar Enter.
import { useId } from "react";

// Campo de texto con sugerencias filtradas; permite seleccionar una o escribir libremente.
export default function AutocompleteInput({
  opciones = [],
  valor,
  onCambio,
  onEnter,
  placeholder,
  className = "campo",
  inputId,
  disabled = false,
  ariaLabel,
}) {
  // useId genera un id estable y único para enlazar el input con su datalist.
  const listId = useId();
  return (
    <>
      {/* Cada tecla informa el texto nuevo al estado del juego padre. */}
      <input
        id={inputId}
        className={className}
        list={listId}
        value={valor}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onCambio(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      />
      <datalist id={listId}>
        {/* Las sugerencias solo ayudan a escribir: la página del juego valida la respuesta. */}
        {opciones.map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}
