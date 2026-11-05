// src/app/admin/page.js
"use client";
import { useState, useEffect } from "react";
import useSocket from "../../hooks/useSocket";
import AdminPlayerForm from "../../components/AdminPlayerForm";
import ClubForm from "../../components/ClubForm";
import "../global.css";
import { BACKEND_URL } from "../../config/backend";

const API_URL = BACKEND_URL;

// Uso: apoyo del alta de jugador en /admin. Busca el ID porque el POST actual responde solo un texto.
function buscarId(jugadores, nombre, apellido, idEquipo) {
  // Recorre al revés para preferir una fila reciente si la respuesta contiene varias trayectorias.
  for (let i = jugadores.length - 1; i >= 0; i--) {
    const j = jugadores[i];
    if (
      j.nombre === nombre &&
      j.apellido === apellido &&
      String(j.id_equipo) === String(idEquipo)
    ) {
      return j.id_jugador;
    }
  }
  return null;
}

export default function AdminPage() {
  // Uso: página /admin. Registra jugadores y clubes; useSocket escucha avisos de cambios del servidor.
  const { socket, isConnected } = useSocket(BACKEND_URL);

  // Mensajes de resultado que se muestran bajo cada formulario.
  const [msgJugador, setMsgJugador] = useState("");
  const [msgClubes, setMsgClubes] = useState("");

  // Administración también abre su propia conexión useSocket.
  // El backend emite estos avisos globalmente después de altas exitosas; el payload actual
  // es { mensaje }. En esta pantalla se registran en consola; no reemplazan los fetch de datos.
  useEffect(() => {
    if (!socket || !isConnected) return;

    const alActualizarJugadores = (data) => {
      console.log("WebSocket - Jugadores:", data.mensaje);
    };
    const alActualizarEquipos = (data) => {
      console.log("WebSocket - Equipos:", data.mensaje);
    };

    socket.on("actualizacionJugadores", alActualizarJugadores); // Evento global enviado tras POST /jugadores.
    socket.on("actualizacionEquipos", alActualizarEquipos); // Evento global enviado tras POST /equipos.

    return () => {
      socket.off("actualizacionJugadores", alActualizarJugadores);
      socket.off("actualizacionEquipos", alActualizarEquipos);
    };
  }, [socket, isConnected]);

  // Primero crea Jugadores; después usa su ID para enviar Datos, Estadisticas y Trayectoria.
  const handleSubmitJugador = async ({ trayectorias, ...jugadorForm }) => {
    setMsgJugador("Creando...");

    const jugadorPayload = {
      nombre: jugadorForm.nombre,
      apellido: jugadorForm.apellido,
      pais: jugadorForm.pais,
      posicion: jugadorForm.posicion,
      liga_actual: jugadorForm.liga_actual,
      dorsal_equipo: Number(jugadorForm.dorsal_equipo) || 0,
      dorsal_seleccion: Number(jugadorForm.dorsal_seleccion) || 0,
      valor_mercado: Number(jugadorForm.valor_mercado) || 0,
      id_equipo: Number(jugadorForm.id_equipo) || 0,
    };

    try {
      const res1 = await fetch(`${API_URL}/jugadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jugadorPayload),
      });

      const text1 = await res1.text();
      if (!res1.ok) {
        setMsgJugador(text1);
        return false;
      }

      const jugadores = await (await fetch(`${API_URL}/jugadores`)).json();
      const idJugador = buscarId(
        jugadores,
        jugadorPayload.nombre,
        jugadorPayload.apellido,
        jugadorPayload.id_equipo
      );

      if (!idJugador) {
        setMsgJugador("No se obtuvo el ID.");
        return false;
      }

      const datosPayload = {
        id_jugador: idJugador,
        edad: Number(jugadorForm.edad) || 0,
        altura: Number(jugadorForm.altura) || 0,
        peso: Number(jugadorForm.peso) || 0,
        pierna_habil: jugadorForm.pierna_habil,
      };

      const estadisticasPayload = {
        id_jugador: idJugador,
        goles: Number(jugadorForm.goles) || 0,
        asistencias: Number(jugadorForm.asistencias) || 0,
        titulos_equipo: Number(jugadorForm.titulos_equipo) || 0,
        titulos_seleccion: Number(jugadorForm.titulos_seleccion) || 0,
        titulos_individuales: Number(jugadorForm.titulos_individuales) || 0,
      };

      const trayectoriasPayloads = trayectorias.map((t) => ({
        id_jugador: idJugador,
        id_equipo: Number(jugadorForm.id_equipo) || 1,
        anio_traspaso: Number(t.anio_traspaso) || 0,
        anio_ingreso: Number(t.anio_ingreso) || 0,
      }));

      setMsgJugador("Guardando datos...");

      // Promise.all espera juntas las altas HTTP de Datos, Estadisticas y Trayectoria.
      // Es una herramienta de JavaScript para coordinar promesas, no desarrollada en el apunte.
      const promesas = [
        fetch(`${API_URL}/datos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosPayload),
        }),
        fetch(`${API_URL}/estadisticas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(estadisticasPayload),
        }),
        ...trayectoriasPayloads.map((t) =>
          fetch(`${API_URL}/trayectoria`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(t),
          })
        ),
      ];

      const respuestas = await Promise.all(promesas);
      const textos = await Promise.all(respuestas.map((r) => r.text()));

      if (respuestas.some((r) => !r.ok)) {
        setMsgJugador(textos.join(" | "));
        return false;
      }

      setMsgJugador(`${text1} · Guardado.`);
      return true;
    } catch (err) {
      console.error(err);
      setMsgJugador("No se pudo conectar con el backend.");
      return false;
    }
  };

  // Envía un alta de Equipo; el formulario compartido se limpia si la respuesta fue correcta.
  const handleSubmitClubes = async (clubForm) => {
    setMsgClubes("Guardando...");

    try {
      const r = await fetch(`${API_URL}/equipos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubForm),
      });
      const t = await r.text();
      setMsgClubes(t);
      return r.ok;
    } catch (err) {
      console.error(err);
      setMsgClubes("No se pudo conectar con el backend.");
      return false;
    }
  };

  return (
    <main className="adminPagina">
      {/* El primer formulario guarda al jugador y después completa sus tablas relacionadas. */}
      <div className="adminEncabezado">
        <div>
          <p className="adminEyebrow">GESTIÓN DEL JUEGO</p>
          <h1>Panel de administración</h1>
          <p>Actualizá la información de jugadores y clubes.</p>
        </div>
        <span className={`adminEstado ${isConnected ? "adminEstadoConectado" : ""}`}>
          <span aria-hidden="true" />{isConnected ? "En línea" : "Desconectado"}
        </span>
      </div>

      <section className="adminSeccion">
        <h2>Jugador completo</h2>
        <AdminPlayerForm onGuardar={handleSubmitJugador} mensaje={msgJugador} />
      </section>

      {/* Este formulario crea registros independientes en Equipos. */}
      <section className="adminSeccion">
        <h2>Clubes</h2>
        <ClubForm onGuardar={handleSubmitClubes} mensaje={msgClubes} />
      </section>
    </main>
  );
}
