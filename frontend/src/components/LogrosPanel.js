"use client";

import { useEffect, useState } from "react";
import { LOGROS } from "../utils/logros";

// Panel del menú: muestra toda la lista de logros y marca cuáles ya desbloqueó el jugador.
export default function LogrosPanel() {
  const [desbloqueados, setDesbloqueados] = useState([]);

  // Lee los IDs guardados por ResultCard al terminar partidas en este navegador.
  useEffect(() => {
    const datos = JSON.parse(window.localStorage.getItem("fulboLogros") || "{}");
    setDesbloqueados(Array.isArray(datos.logros) ? datos.logros : []);
  }, []);

  const cantidadDesbloqueados = LOGROS.filter((logro) => desbloqueados.includes(logro.id)).length;

  return (
    <section className="logrosPanel" aria-labelledby="tituloLogros">
      <div className="logrosPanelCabecera">
        <div>
          <p className="lobbyEtiqueta">Colección personal</p>
          <h2 id="tituloLogros">Logros</h2>
        </div>
        <strong>{cantidadDesbloqueados} / {LOGROS.length}</strong>
      </div>
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
    </section>
  );
}
