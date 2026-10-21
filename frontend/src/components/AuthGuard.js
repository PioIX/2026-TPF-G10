// Protección visual reutilizable: espera al navegador y redirige si no hay usuario en localStorage.
// localStorage pertenece al navegador y no está explicado en los apuntes; el backend sigue validando el login.
// No reemplaza la validación de sesión del backend. Actualmente ninguna ruta lo importa.
"use client";
// Comprueba la sesión local y redirige al login si no hay usuario.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Envolver una ruta con este componente evita mostrarla antes de revisar el estado local.
export default function AuthGuard({ children }) {
  const router = useRouter();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // localStorage es una API del navegador, por eso se lee dentro de useEffect y no durante SSR.
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
