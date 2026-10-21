"use client";
// Comprueba la sesión local y redirige al login si no hay usuario.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Envolvé con esto las páginas que requieren sesión (menú y juegos).
export default function AuthGuard({ children }) {
  const router = useRouter();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // localStorage solo está disponible al montar en el navegador.
    const usuarioId = localStorage.getItem("usuarioId");
    if (usuarioId) {
      // El chequeo ocurre luego del montaje para evitar leer localStorage en SSR.
      const temporizador = window.setTimeout(() => setListo(true), 0);
      return () => window.clearTimeout(temporizador);
    }

    router.replace("/login");
  }, [router]);

  return listo ? children : null;
}
