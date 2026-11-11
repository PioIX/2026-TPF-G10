"use client";
import AutocompleteInput from "./AutocompleteInput";
import Button from "./Button";

// Entrada reutilizable para elegir una respuesta y confirmarla con teclado o botón.
export default function GuessBox({ opciones, valor, onCambio, onAdivinar, deshabilitado }) {
  // Usa la misma acción de confirmación cuando se pulsa el botón o la tecla Enter.
  const enviar = () => {
    // trim quita espacios en los extremos; el padre recibe el valor limpio para validarlo.
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
