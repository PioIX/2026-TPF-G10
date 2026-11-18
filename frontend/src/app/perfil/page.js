"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import AutocompleteInput from "../../components/AutocompleteInput";
import Button from "../../components/Button";
import SportsImage from "../../components/SportsImage";
import { BACKEND_URL } from "../../config/backend";
import { normalizarTexto } from "../../utils/normalizarTexto";

// El perfil y el catálogo de jugadores se cargan desde el backend; la selección
// del avatar se guarda en Usuarios para conservarla entre sesiones.
function PerfilContenido() {
  const [perfil, setPerfil] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [avatarTexto, setAvatarTexto] = useState("");
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [error, setError] = useState("");
  const [errorAvatar, setErrorAvatar] = useState("");
  const [cargando, setCargando] = useState(true);

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
        if (errorFetch.name !== "AbortError") setError(errorFetch.message || "Error al conectar con el servidor.");
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    fetch(`${BACKEND_URL}/jugadores`, { signal: controlador.signal })
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error("No se pudo cargar la lista de jugadores.");
        const filas = await respuesta.json();
        const unicos = new Map();
        (Array.isArray(filas) ? filas : []).forEach((fila) => {
          const nombre = `${fila.nombre || ""} ${fila.apellido || ""}`.trim();
          if (fila.id_jugador && nombre && !unicos.has(Number(fila.id_jugador))) {
            unicos.set(Number(fila.id_jugador), {
              id: Number(fila.id_jugador),
              nombre,
              pais: fila.pais || "",
            });
          }
        });
        setJugadores(Array.from(unicos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      })
      .catch((errorFetch) => {
        if (errorFetch.name !== "AbortError") setErrorAvatar(errorFetch.message);
      });

    return () => controlador.abort();
  }, []);

  const opcionesJugadores = useMemo(() => jugadores.map((jugador) => jugador.nombre), [jugadores]);
  const jugadorVisible = jugadorSeleccionado;
  const inicial = perfil?.name?.trim().charAt(0).toUpperCase() || "?";
  const efectividad = perfil && perfil.partidasJugadas > 0
    ? Math.round((perfil.victorias * 100) / perfil.partidasJugadas)
    : 0;
  const elegirAvatar = (nombre) => {
    const jugador = jugadores.find((opcion) => normalizarTexto(opcion.nombre) === normalizarTexto(nombre));
    setJugadorSeleccionado(jugador || null);
    setErrorAvatar("");
  };

  const quitarSeleccion = () => {
    setAvatarTexto("");
    setJugadorSeleccionado(null);
  };

  return (
    <main className="pfPagina">
      <section className="pfTarjeta" aria-labelledby="pfTitulo">
        {jugadorVisible ? (
          <SportsImage
            tipo="player"
            nombre={jugadorVisible.nombre}
            alt={`Foto de ${jugadorVisible.nombre}`}
            size={184}
            className="pfAvatar pfAvatarImagen"
          />
        ) : (
          <div className="pfAvatar" aria-hidden="true">{inicial}</div>
        )}
        <p className="pfEtiqueta">JUGADOR</p>
        <h2 id="pfTitulo" className="pfNombre">
          {cargando ? "Cargando..." : perfil ? perfil.name : "Perfil no disponible"}
        </h2>

        {error && <p className="errorSocket" role="alert">{error}</p>}

        {perfil && (
          <>
            <section className="pfSelector" aria-labelledby="pfSelectorTitulo">
              <div>
                <p className="pfSelectorEtiqueta">PERSONALIZÁ TU PERFIL</p>
                <h3 id="pfSelectorTitulo">Elegí un jugador para tu foto</h3>
              </div>
              <AutocompleteInput
                opciones={opcionesJugadores}
                valor={avatarTexto}
                onCambio={(texto) => {
                  setAvatarTexto(texto);
                  setJugadorSeleccionado(null);
                }}
                onSeleccion={elegirAvatar}
                placeholder="Buscá por nombre o apellido"
                className="pfSelectorInput"
                ariaLabel="Buscar jugador para la foto de perfil"
                disabled={jugadores.length === 0}
              />
              {jugadorSeleccionado && (
                <div className="pfSelectorAcciones">
                  <Button type="button" variant="ghost" onClick={quitarSeleccion}>
                    Volver a mi inicial
                  </Button>
                </div>
              )}
              <p className="pfSelectorNota">La foto es temporal y vuelve a tu inicial al salir del perfil.</p>
              {errorAvatar && <p className="pfSelectorError" role="alert">{errorAvatar}</p>}
            </section>

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
