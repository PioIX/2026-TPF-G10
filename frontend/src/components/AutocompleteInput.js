// Campo controlado con sugerencias HTML nativas, usado por los formularios de respuesta.

"use client";
// Input con sugerencias y envío opcional al presionar Enter.
import { useId, useMemo, useState } from "react";
import { normalizarTexto } from "../utils/normalizarTexto";

function coincideConUnaErrata(opcion, palabra) {
  if (palabra.length < 5) return false;
  const palabrasOpcion = opcion.split(" ");
  return palabrasOpcion.some((candidata) => {
    if (Math.abs(candidata.length - palabra.length) > 1) return false;
    let i = 0;
    let j = 0;
    let diferencias = 0;
    while (i < palabra.length && j < candidata.length) {
      if (palabra[i] === candidata[j]) {
        i += 1;
        j += 1;
      } else {
        diferencias += 1;
        if (diferencias > 1) return false;
        if (palabra.length > candidata.length) i += 1;
        else if (palabra.length < candidata.length) j += 1;
        else { i += 1; j += 1; }
      }
    }
    if (i < palabra.length || j < candidata.length) diferencias += 1;
    return diferencias <= 1;
  });
}

// Campo de texto con sugerencias filtradas; permite seleccionar una o escribir libremente.
export default function AutocompleteInput({
  opciones = [],
  valor,
  onCambio,
  onSeleccion,
  onEnter,
  placeholder,
  className = "campo",
  inputId,
  disabled = false,
  ariaLabel,
}) {
  const listId = useId();
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const opcionesFiltradas = useMemo(() => {
    const consulta = normalizarTexto(valor);
    const opcionesUnicas = [...new Set(opciones.filter(Boolean))];
    if (!consulta) return opcionesUnicas.slice(0, 8);

    const palabras = consulta.split(" ");
    return opcionesUnicas
      .filter((opcion) => {
        const clave = normalizarTexto(opcion);
        return palabras.every((palabra) => (
          clave.includes(palabra) || coincideConUnaErrata(clave, palabra)
        ));
      })
      .slice(0, 8);
  }, [opciones, valor]);

  const elegirOpcion = (opcion) => {
    onCambio(opcion);
    onSeleccion?.(opcion);
    setAbierto(false);
    setIndiceActivo(-1);
  };

  const manejarTecla = (evento) => {
    if (evento.key === "ArrowDown" && opcionesFiltradas.length) {
      evento.preventDefault();
      setAbierto(true);
      setIndiceActivo((actual) => (actual + 1) % opcionesFiltradas.length);
      return;
    }
    if (evento.key === "ArrowUp" && opcionesFiltradas.length) {
      evento.preventDefault();
      setAbierto(true);
      setIndiceActivo((actual) => (actual <= 0 ? opcionesFiltradas.length - 1 : actual - 1));
      return;
    }
    if (evento.key === "Escape") {
      setAbierto(false);
      setIndiceActivo(-1);
      return;
    }
    if (evento.key === "Enter") {
      if (abierto && indiceActivo >= 0 && opcionesFiltradas[indiceActivo]) {
        evento.preventDefault();
        elegirOpcion(opcionesFiltradas[indiceActivo]);
      } else if (!onEnter && opcionesFiltradas.length === 1) {
        evento.preventDefault();
        elegirOpcion(opcionesFiltradas[0]);
      } else {
        onEnter?.();
      }
    }
  };

  return (
    <div className="autocompletadoContenedor">
      <input
        id={inputId}
        className={className}
        value={valor}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={abierto && opcionesFiltradas.length > 0}
        aria-controls={listId}
        aria-activedescendant={indiceActivo >= 0 ? `${listId}-${indiceActivo}` : undefined}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onChange={(evento) => {
          onCambio(evento.target.value);
          setAbierto(true);
          setIndiceActivo(-1);
        }}
        onKeyDown={manejarTecla}
      />
      {abierto && !disabled && opcionesFiltradas.length > 0 && (
        <ul className="autocompletadoLista" id={listId} role="listbox">
          {opcionesFiltradas.map((opcion, indice) => (
            <li key={opcion} role="presentation">
              <button
                id={`${listId}-${indice}`}
                type="button"
                role="option"
                aria-selected={indice === indiceActivo}
                className={`autocompletadoOpcion ${indice === indiceActivo ? "activa" : ""}`}
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => elegirOpcion(opcion)}
              >
                {opcion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
