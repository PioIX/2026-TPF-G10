// Caja de pista preparada para Adivina el jugador; la ruta actual dibuja esta sección directamente.
"use client";
// Muestra la pista disponible y permite solicitarla una sola vez.
import Message from "./Message";

export default function ClueBox({ pista, usada, onPedir }) {
  // La página conserva el estado; este componente solo presenta texto y avisa al tocar la cámara.
  return (
    <div className="pista">
      <Message>{usada ? pista : "Pulsá la cámara para ver una pista."}</Message>
      <button className="btn btn-ghost" onClick={onPedir} disabled={usada} aria-label="Pedir pista">📸</button>
    </div>
  );
}
