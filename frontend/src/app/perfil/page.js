"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import Button from "../../components/Button";
import { BACKEND_URL } from "../../config/backend";

// Consulta /perfil al backend; las partidas y victorias salen de UsuariosXPartida,
// enlazada con Usuarios. Este componente presenta esos totales y calcula su porcentaje.
function PerfilContenido() {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  // El ID que se guardó tras el login identifica qué fila del perfil se solicita.
  // AbortController cancela el fetch si se abandona la página antes de recibir respuesta.
  useEffect(() => {
    const id = window.localStorage.getItem("usuarioId");
    const controlador = new AbortController();

    fetch(`${BACKEND_URL}/perfil?id=${encodeURIComponent(id)}`, { signal: controlador.signal })
      .then(async (respuesta) => {
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error || "No se pudo cargar el perfil.");
        setPerfil(datos);
      })
      .catch((errorFetch) => {
        if (errorFetch.name === "AbortError") return;
        setError(errorFetch.message || "Error al conectar con el servidor.");
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    return () => controlador.abort();
  }, []);

  // Inicial del nombre para el avatar y porcentaje de victorias para la barra.
  const inicial = perfil?.name?.trim().charAt(0).toUpperCase() || "?";
  const efectividad = perfil && perfil.partidasJugadas > 0
    ? Math.round((perfil.victorias * 100) / perfil.partidasJugadas)
    : 0;

  return (
    <main className="pfPagina">
      <section className="pfTarjeta" aria-labelledby="pfTitulo">
        <div className="pfAvatar" aria-hidden="true">{inicial}</div>
        <p className="pfEtiqueta">JUGADOR</p>
        <h2 id="pfTitulo" className="pfNombre">
          {cargando ? "Cargando..." : perfil ? perfil.name : "Perfil no disponible"}
        </h2>

        {error && <p className="errorSocket" role="alert">{error}</p>}

        {perfil && (
          <>
            <div className="pfStats">
              <div className="pfStat">
                <span className="pfStatIcono" aria-hidden="true">⚽</span>
                <strong className="pfStatNumero">{perfil.partidasJugadas}</strong>
                <span className="pfStatTexto">Partidas jugadas</span>
              </div>
              <div className="pfStat">
                <span className="pfStatIcono" aria-hidden="true">🏆</span>
                <strong className="pfStatNumero">{perfil.victorias}</strong>
                <span className="pfStatTexto">Victorias</span>
              </div>
            </div>

            <div className="pfEfectividad">
              <div className="pfEfectividadTexto">
                <span>Efectividad</span>
                <strong>{efectividad}%</strong>
              </div>
              <div className="pfBarra" role="progressbar" aria-valuenow={efectividad} aria-valuemin={0} aria-valuemax={100}>
                <div className="pfBarraRelleno" style={{ width: `${efectividad}%` }} />
              </div>
            </div>
          </>
        )}

        <Button href="/menu" variant="ghost">Volver al menú</Button>
      </section>
    </main>
  );
}

export default function PerfilPage() {
  return (
    <AuthGuard>
      <PerfilContenido />
    </AuthGuard>
  );
}
