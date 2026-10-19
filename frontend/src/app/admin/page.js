// src/app/admin/page.js
"use client";
import { useState, useEffect } from "react";
import useSocket from "../../hooks/useSocket";
import "../global.css";

const API_URL = "http://localhost:4000";

function buscarId(jugadores, nombre, apellido, idEquipo) {
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
  const { socket, isConnected } = useSocket("ws://localhost:4000");

  // Estados para mensajes
  const [msgJugador, setMsgJugador] = useState("");
  const [msgClubes, setMsgClubes] = useState("");

  // Estado del formulario de Jugador Completo
  const [jugadorForm, setJugadorForm] = useState({
    nombre: "",
    apellido: "",
    pais: "",
    posicion: "",
    dorsal_equipo: "",
    dorsal_seleccion: "",
    valor_mercado: "",
    id_equipo: "",
    edad: "",
    altura: "",
    peso: "",
    pierna_habil: "",
    goles: "",
    asistencias: "",
    titulos_equipo: "",
    titulos_seleccion: "",
    titulos_individuales: "",
  });

  // Estado para las filas dinámicas de Trayectoria
  const [trayectorias, setTrayectorias] = useState([
    { anio_traspaso: "", anio_ingreso: "" },
  ]);

  // Estado del formulario de Clubes
  const [clubForm, setClubForm] = useState({
    nombre_equipo: "",
    anio_creacion: "",
    titulos_nacionales: "",
    titulos_internacionales: "",
    ciudad: "",
    presidente: "",
    dt_actual: "",
    apodo: "",
    cantidad_socios: "",
    estadio: "",
  });

  // Escucha de eventos por WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const alActualizarJugadores = (data) => {
      console.log("WebSocket - Jugadores:", data.mensaje);
    };
    const alActualizarEquipos = (data) => {
      console.log("WebSocket - Equipos:", data.mensaje);
    };

    socket.on("actualizacionJugadores", alActualizarJugadores);
    socket.on("actualizacionEquipos", alActualizarEquipos);

    return () => {
      socket.off("actualizacionJugadores", alActualizarJugadores);
      socket.off("actualizacionEquipos", alActualizarEquipos);
    };
  }, [socket, isConnected]);

  // Manejadores de cambios en inputs
  const handleJugadorChange = (e) => {
    const { name, value } = e.target;
    setJugadorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTrayectoriaChange = (index, e) => {
    const { name, value } = e.target;
    setTrayectorias((prev) =>
      prev.map((fila, i) => (i === index ? { ...fila, [name]: value } : fila))
    );
  };

  const agregarFilaTrayectoria = () => {
    setTrayectorias((prev) => [...prev, { anio_traspaso: "", anio_ingreso: "" }]);
  };

  const quitarFilaTrayectoria = (index) => {
    setTrayectorias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClubChange = (e) => {
    const { name, value } = e.target;
    setClubForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit de Jugador Completo
  const handleSubmitJugador = async (e) => {
    e.preventDefault();
    setMsgJugador("Creando...");

    const jugadorPayload = {
      nombre: jugadorForm.nombre,
      apellido: jugadorForm.apellido,
      pais: jugadorForm.pais,
      posicion: jugadorForm.posicion,
      poisicion: jugadorForm.posicion, // Enviamos ambos por el typo "poisicion" en el backend
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
        return;
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
        return;
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
      } else {
        setMsgJugador(`${text1} · Guardado.`);
        setJugadorForm({
          nombre: "",
          apellido: "",
          pais: "",
          posicion: "",
          dorsal_equipo: "",
          dorsal_seleccion: "",
          valor_mercado: "",
          id_equipo: "",
          edad: "",
          altura: "",
          peso: "",
          pierna_habil: "",
          goles: "",
          asistencias: "",
          titulos_equipo: "",
          titulos_seleccion: "",
          titulos_individuales: "",
        });
        setTrayectorias([{ anio_traspaso: "", anio_ingreso: "" }]);
      }
    } catch (err) {
      console.error(err);
      setMsgJugador("No se pudo conectar con el backend.");
    }
  };

  // Submit de Clubes
  const handleSubmitClubes = async (e) => {
    e.preventDefault();
    setMsgClubes("Guardando...");

    try {
      const r = await fetch(`${API_URL}/equipos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubForm),
      });
      const t = await r.text();
      setMsgClubes(t);
      if (r.ok) {
        setClubForm({
          nombre_equipo: "",
          anio_creacion: "",
          titulos_nacionales: "",
          titulos_internacionales: "",
          ciudad: "",
          presidente: "",
          dt_actual: "",
          apodo: "",
          cantidad_socios: "",
          estadio: "",
        });
      }
    } catch (err) {
      console.error(err);
      setMsgClubes("No se pudo conectar con el backend.");
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "800px", width: "100%" }}>
      <h1>Panel de Administración</h1>
      <p>
        Bienvenido, administrador.{" "}
        {isConnected ? "🟢 Conectado en tiempo real" : "🔴 Desconectado"}
      </p>

      <section style={{ marginTop: "20px" }}>
        <h2>Jugador completo</h2>
        <form id="form-jugador-completo" onSubmit={handleSubmitJugador}>
          <h3>Jugadores</h3>
          <input type="text" name="nombre" placeholder="Nombre" value={jugadorForm.nombre} onChange={handleJugadorChange} required />
          <input type="text" name="apellido" placeholder="Apellido" value={jugadorForm.apellido} onChange={handleJugadorChange} required />
          <input type="text" name="pais" placeholder="País" value={jugadorForm.pais} onChange={handleJugadorChange} required />
          <input type="text" name="posicion" placeholder="Posición" value={jugadorForm.posicion} onChange={handleJugadorChange} required />
          <input type="number" name="dorsal_equipo" placeholder="Dorsal equipo" value={jugadorForm.dorsal_equipo} onChange={handleJugadorChange} required />
          <input type="number" name="dorsal_seleccion" placeholder="Dorsal selección" value={jugadorForm.dorsal_seleccion} onChange={handleJugadorChange} required />
          <input type="number" name="valor_mercado" placeholder="Valor de mercado" value={jugadorForm.valor_mercado} onChange={handleJugadorChange} required />
          <input type="number" name="id_equipo" placeholder="ID del equipo" value={jugadorForm.id_equipo} onChange={handleJugadorChange} required />

          <h3>Datos</h3>
          <input type="number" name="edad" placeholder="Edad" value={jugadorForm.edad} onChange={handleJugadorChange} required />
          <input type="number" name="altura" placeholder="Altura" value={jugadorForm.altura} onChange={handleJugadorChange} required />
          <input type="number" name="peso" placeholder="Peso" value={jugadorForm.peso} onChange={handleJugadorChange} required />
          <input type="text" name="pierna_habil" placeholder="Pierna hábil" value={jugadorForm.pierna_habil} onChange={handleJugadorChange} required />

          <h3>Estadísticas</h3>
          <input type="number" name="goles" placeholder="Goles" value={jugadorForm.goles} onChange={handleJugadorChange} required />
          <input type="number" name="asistencias" placeholder="Asistencias" value={jugadorForm.asistencias} onChange={handleJugadorChange} required />
          <input type="number" name="titulos_equipo" placeholder="Títulos equipo" value={jugadorForm.titulos_equipo} onChange={handleJugadorChange} required />
          <input type="number" name="titulos_seleccion" placeholder="Títulos selección" value={jugadorForm.titulos_seleccion} onChange={handleJugadorChange} required />
          <input type="number" name="titulos_individuales" placeholder="Títulos individuales" value={jugadorForm.titulos_individuales} onChange={handleJugadorChange} required />

          <h3>Trayectoria</h3>
          <p>
            La trayectoria representa la relación muchos a muchos entre jugador y
            equipo. Podés cargar una fila por equipo en el que pasó.
          </p>
          <button id="btn-agregar-trayectoria" type="button" onClick={agregarFilaTrayectoria}>
            +
          </button>

          <div id="trayectoria">
            {trayectorias.map((fila, index) => (
              <div key={index} className="celda-trayectoria">
                <input
                  type="number"
                  name="anio_traspaso"
                  placeholder="Año de traspaso"
                  value={fila.anio_traspaso}
                  onChange={(e) => handleTrayectoriaChange(index, e)}
                  required
                />
                <input
                  type="number"
                  name="anio_ingreso"
                  placeholder="Año de ingreso"
                  value={fila.anio_ingreso}
                  onChange={(e) => handleTrayectoriaChange(index, e)}
                  required
                />
                <button
                  type="button"
                  className="btn-quitar-trayectoria"
                  onClick={() => quitarFilaTrayectoria(index)}
                >
                  −
                </button>
              </div>
            ))}
          </div>

          <button type="submit">Guardar jugador completo</button>
          <p id="mensaje-jugador-completo">{msgJugador}</p>
        </form>
      </section>

      <section style={{ marginTop: "30px" }}>
        <h2>Clubes</h2>
        <form id="form-clubes" onSubmit={handleSubmitClubes}>
          <input type="text" name="nombre_equipo" placeholder="Nombre del club" value={clubForm.nombre_equipo} onChange={handleClubChange} required />
          <input type="number" name="anio_creacion" placeholder="Año de creación" value={clubForm.anio_creacion} onChange={handleClubChange} required />
          <input type="number" name="titulos_nacionales" placeholder="Títulos nacionales" value={clubForm.titulos_nacionales} onChange={handleClubChange} required />
          <input type="number" name="titulos_internacionales" placeholder="Títulos internacionales" value={clubForm.titulos_internacionales} onChange={handleClubChange} required />
          <input type="text" name="ciudad" placeholder="Ciudad" value={clubForm.ciudad} onChange={handleClubChange} required />
          <input type="text" name="presidente" placeholder="Presidente" value={clubForm.presidente} onChange={handleClubChange} required />
          <input type="text" name="dt_actual" placeholder="DT actual" value={clubForm.dt_actual} onChange={handleClubChange} required />
          <input type="text" name="apodo" placeholder="Apodo" value={clubForm.apodo} onChange={handleClubChange} required />
          <input type="number" name="cantidad_socios" placeholder="Cantidad de socios" value={clubForm.cantidad_socios} onChange={handleClubChange} required />
          <input type="text" name="estadio" placeholder="Estadio" value={clubForm.estadio} onChange={handleClubChange} required />
          <button type="submit">Guardar club</button>
          <p id="mensaje-clubes">{msgClubes}</p>
        </form>
      </section>
    </main>
  );
}