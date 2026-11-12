"use client";
import Message from "./Message";

// Presenta una pista disponible y el control para pedirla si la partida lo permite.
export default function ClueBox({ pista, usada, onPedir, deshabilitada = false }) {
  return (
    <div id="pista" className={`pista ${usada ? "visible" : ""}`}>
      <Message as="span" tipo="info">
        {usada ? pista : "Pulsa el icono de cámara para mostrar una pista."}
      </Message>
      <button
        id="btn-camara"
        type="button"
        className="btn-icono comodinIcono"
        onClick={onPedir}
        disabled={usada || deshabilitada}
        aria-label="Usar comodín para revelar una pista"
      >
        📸
      </button>
    </div>
  );
}
