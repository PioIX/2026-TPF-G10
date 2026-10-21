//“ClueBox muestra la pista del juego Adivina el jugador. Tiene un botón con la cámara que la revela una sola vez: después de usarla, el botón se deshabilita. El componente solo muestra el mensaje; el estado de si la pista se usó y el texto de la pista los maneja la página.”//ClueBox es la caja de la pista del juego Adivina el jugador. Muestra un mensaje y un botón de cámara 📸 que revela la pista, y solo se puede usar una vez.
//ClueBox es la caja de la pista del juego Adivina el jugador. Muestra un mensaje y un botón de cámara 📸 que revela la pista, y solo se puede usar una vez
"use client";
// Muestra la pista disponible y permite solicitarla una sola vez.
import Message from "./Message";

export default function ClueBox({ pista, usada, onPedir }) {
  return (
    <div className="pista">
      <Message>{usada ? pista : "Pulsá la cámara para ver una pista."}</Message>
      <button className="btn btn-ghost" onClick={onPedir} disabled={usada} aria-label="Pedir pista">📸</button>
    </div>
  );
}