"use client";
import Message from "./Message";

export default function ClueBox({ pista, usada, onPedir, deshabilitada = false }) {
  return (
    <div id="pista" className={`pista ${usada ? "visible" : ""}`}>
      <Message as="span" tipo="info">
        {usada ? pista : "Pulsa el icono de cámara para mostrar una pista."}
      </Message>
      <button
        id="btn-camara"
        type="button"
        className="btn-icono"
        onClick={onPedir}
        disabled={usada || deshabilitada}
        aria-label="Pedir pista"
      >
        📸
      </button>
    </div>
  );
}
