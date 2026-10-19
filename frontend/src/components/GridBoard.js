"use client";
import { Fragment } from "react";
import useSportsDbImage from "@/hooks/useSportsDbImage";

function EncabezadoEquipo({ nombre }) {
  const escudo = useSportsDbImage("team", nombre);
  return (
    <div className="cell logo">
      {escudo && <img src={escudo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />}
      <span>{nombre}</span>
    </div>
  );
}

function CeldaJugador({ encontrado, onClick }) {
  const foto = useSportsDbImage("player", encontrado ? `${encontrado.nombre} ${encontrado.apellido}` : "");
  if (!encontrado) {
    return <button className="cell player clickable" onClick={onClick}>?</button>;
  }
  return (
    <div className="cell player found">
      {foto && <img src={foto} alt="" style={{ width: 60, height: 60, objectFit: "contain" }} />}
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
