"use client";
import AutocompleteInput from "./AutocompleteInput";
import Button from "./Button";

export default function GuessBox({ opciones, valor, onCambio, onAdivinar, deshabilitado }) {
  const enviar = () => {
    if (valor?.trim() && !deshabilitado) onAdivinar(valor.trim());
  };

  return (
    <div id="caja-adivinar">
      <AutocompleteInput
        opciones={opciones}
        valor={valor}
        onCambio={onCambio}
        onEnter={enviar}
        placeholder="Escribe el nombre del futbolista"
        inputId="input-adivinar"
        className="input-pill"
        ariaLabel="Nombre del futbolista"
      />
      <Button
        id="btn-adivinar"
        type="button"
        className="btn-icono"
        onClick={enviar}
        disabled={deshabilitado}
        aria-label="Adivinar jugador"
      >
        🚩
      </Button>
    </div>
  );
}
