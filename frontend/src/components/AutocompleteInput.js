//“AutocompleteInput es un input con sugerencias. Usa el datalist nativo de HTML, así el navegador filtra las opciones mientras escribís. Es un componente controlado: el texto lo guarda quien lo usa y se entera de cada cambio por la prop onCambio. Lo reutilizamos en el Grid y en los juegos de adivinar.”
//AutocompleteInput es un campo de texto que sugiere opciones mientras escribís, como el buscador de Google pero con una lista fija

"use client";
// Input con sugerencias y envío opcional al presionar Enter.
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
