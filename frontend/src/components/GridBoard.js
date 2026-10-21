// Tablero preparado para Grid; grid/page.js hoy dibuja una versión propia y no importa este archivo.
"use client";
// Dibuja la grilla, sus encabezados y las celdas de respuesta.
import { Fragment } from "react";
import Image from "next/image";
import useSportsDbImage from "@/hooks/useSportsDbImage";

// Subcomponente: obtiene y muestra el escudo y nombre de un club.
function EncabezadoEquipo({ nombre }) {
  const escudo = useSportsDbImage("team", nombre);
  return (
    <div className="cell logo">
      {escudo && <Image src={escudo} alt="" width={40} height={40} unoptimized style={{ objectFit: "contain" }} />}
      <span>{nombre}</span>
    </div>
  );
}

// Subcomponente: muestra ? hasta acertar y luego consulta/enseña la foto y el apellido.
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

// Props: columnas (equipos), filas (países), celdas resueltas y callback al tocar una celda.
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
