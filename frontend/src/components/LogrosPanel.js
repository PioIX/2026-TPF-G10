"use client";

import { useEffect, useState } from "react";
import { LOGROS } from "../utils/logros";
import { BACKEND_URL } from "../config/backend";

// Panel del menú: muestra toda la lista de logros y marca cuáles ya desbloqueó el jugador.
export default function LogrosPanel() {
  const [desbloqueados, setDesbloqueados] = useState([]);

  // Lee solo los logros del usuario conectado para no mostrar los de otra cuenta.
  useEffect(() => {
    const idUsuario = window.localStorage.getItem("usuarioId");
    if (!idUsuario) {
      setDesbloqueados([]);
      return;
    }

    // El identificador es un query param; el backend devuelve { logros: [id, ...] }.
    // El AbortController evita actualizar el componente si el menú se desmonta durante la consulta.
    const controlador = new AbortController();
    fetch(`${BACKEND_URL}/logros?id=${encodeURIComponent(idUsuario)}`, { signal: controlador.signal })
      .then(async (respuesta) => {
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error || "No se pudieron cargar los logros.");
        setDesbloqueados(Array.isArray(datos.logros) ? datos.logros : []);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("No se pudieron cargar los logros:", error);
      });
    return () => controlador.abort();
  }, []);

  // filter cuenta qué elementos del catálogo tienen su ID en la respuesta del backend.
  const cantidadDesbloqueados = LOGROS.filter((logro) => desbloqueados.includes(logro.id)).length;
  const progreso = Math.round((cantidadDesbloqueados / LOGROS.length) * 100);

  return (
    <details className="logrosPanel">
      {/* El resumen funciona como pestaña desplegable y siempre deja visible el progreso. */}
      <summary className="logrosPanelResumen" aria-controls="contenidoLogros">
        <span className="logrosPanelEmblema" aria-hidden="true">🏆</span>
        <span className="logrosPanelTitulo">
          <span className="lobbyEtiqueta">Colección personal</span>
          <strong id="tituloLogros">Logros</strong>
        </span>
        <span className="logrosPanelProgresoTexto">{cantidadDesbloqueados} / {LOGROS.length}</span>
        <span className="logrosPanelFlecha" aria-hidden="true">▽</span>
      </summary>
      <div className="logrosPanelContenido" id="contenidoLogros">
        <div className="logrosBarra" role="progressbar" aria-label="Progreso de logros" aria-valuenow={progreso} aria-valuemin="0" aria-valuemax="100">
          <span style={{ width: `${progreso}%` }} />
        </div>
        <p className="logrosAyuda">Desbloqueá logros jugando y ganando partidas.</p>
        {/* Se dibuja el catálogo completo; cada ID ausente de /logros queda como pendiente. */}
        <ul className="logrosLista">
          {LOGROS.map((logro) => {
            const desbloqueado = desbloqueados.includes(logro.id);
            return (
              <li className={desbloqueado ? "logroItem logroItemDesbloqueado" : "logroItem"} key={logro.id}>
                <span className="logroIcono" aria-hidden="true">{desbloqueado ? "🏆" : "🔒"}</span>
                <span>
                  <strong>{logro.nombre}</strong>
                  <small>{logro.descripcion}</small>
                </span>
                <span className="logroEstado">{desbloqueado ? "Desbloqueado" : "Pendiente"}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
