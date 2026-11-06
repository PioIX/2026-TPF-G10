"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import Button from "../../components/Button";
import { BACKEND_URL } from "../../config/backend";

function PerfilContenido() {
  const [perfil, setPerfil] = useState(null);   // datos que llegan del backend
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const id = window.localStorage.getItem("usuarioId");

    fetch(`${BACKEND_URL}/perfil?id=${encodeURIComponent(id)}`)
      .then(async (respuesta) => {
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error || "No se pudo cargar el perfil.");
        setPerfil(datos);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <main className="perfilPagina">
      <section className="perfilTarjeta">
        <h2>{cargando ? "Cargando..." : perfil ? perfil.name : "Perfil no disponible"}</h2>
        {error && <p role="alert">{error}</p>}
        {perfil && (
          <>
            <p>Partidas jugadas: {perfil.partidasJugadas}</p>
            <p>Victorias: {perfil.victorias}</p>
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