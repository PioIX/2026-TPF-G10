"use client";
import Message from "./Message";

export default function ClueBox({ pista, usada, onPedir }) {
  return (
    <div className="pista">
      <Message>{usada ? pista : "Pulsá la cámara para ver una pista."}</Message>
      <button className="btn btn-ghost" onClick={onPedir} disabled={usada} aria-label="Pedir pista">📸</button>
    </div>
  );
}