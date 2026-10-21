//GridBoard dibuja el tablero del Grid: clubes arriba, países a la izquierda y nueve celdas. Cada celda es un botón con un signo de pregunta, y al acertar muestra la foto y el apellido del jugador. Las imágenes se piden a TheSportsDB con un hook propio que guarda los resultados en caché. El componente solo dibuja; cuando se toca una celda avisa a la página con onCelda, y la página decide qué hacer.”
//dibuja el tablero del juego Grid: una grilla de 4x4 con los clubes arriba, los países a la izquierda y 9 celdas para responder. 
"use client";
// Dibuja la grilla, sus encabezados y las celdas de respuesta.
import { Fragment } from "react";
import Image from "next/image";
import useSportsDbImage from "@/hooks/useSportsDbImage";

// Encabezado de columna: muestra el escudo del club y su nombre.
function EncabezadoEquipo({ nombre }) {
  const escudo = useSportsDbImage("team", nombre);
  return (
    <div className="cell logo">
      {escudo && <Image src={escudo} alt="" width={40} height={40} unoptimized style={{ objectFit: "contain" }} />}
      <span>{nombre}</span>
    </div>
  );
}

// Celda individual: permite responder o muestra al jugador ya acertado.
function CeldaJugador({ encontrado, onClick }) {
  const foto = useSportsDbImage("player", encontrado ? `${encontrado.nombre} ${encontrado.apellido}` : "");
  if (!encontrado) {
    return <button className="cell player clickable" onClick={onClick}>?</button>;
  }
  return (
    <div className="cell player found">
      {foto && <Image src={foto} alt="" width={60} height={60} unoptimized style={{ objectFit: "contain" }} />}
      <strong>{encontrado.apellido}</strong>
    </div>
  );
}

// columnas: nombres de equipos (arriba, con escudo). filas: nombres de países (izquierda).
// celdas: matriz 3x3 con { nombre, apellido } del jugador acertado o null.
export default function GridBoard({ columnas, filas, celdas, onCelda }) {
  return (
    <div className="grid">
      <div className="cell logo title">FULBO11<br />GRID</div>
      {columnas.map((eq) => <EncabezadoEquipo key={eq} nombre={eq} />)}
      {filas.map((pais, r) => (
        <Fragment key={pais}>
          <div className="cell logo">{pais}</div>
          {columnas.map((_, c) => (
            <CeldaJugador key={c} encontrado={celdas[r][c]} onClick={() => onCelda(r, c)} />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
