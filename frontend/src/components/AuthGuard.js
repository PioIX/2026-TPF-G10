// Protección visual de rutas: oculta el contenido y redirige al login si no hay ID local.
// No reemplaza validaciones en el servidor; cada endpoint que maneja datos debe comprobar su acceso.
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Al envolver una página privada, este componente vuelve a revisar el acceso al cambiar la sesión.
export default function AuthGuard({ children }) {
  const router = useRouter();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // Verifica el ID en el navegador y oculta la ruta si el usuario cerró sesión en esta pestaña o en otra.
    const revisarSesion = () => {
      const usuarioId = Number(window.localStorage.getItem("usuarioId"));
      const sesionValida = Number.isSafeInteger(usuarioId) && usuarioId > 0;
      setListo(sesionValida);
      if (!sesionValida) router.replace("/login");
    };

    revisarSesion();
    window.addEventListener("storage", revisarSesion);
    window.addEventListener("sesionActualizada", revisarSesion);
    return () => {
      window.removeEventListener("storage", revisarSesion);
      window.removeEventListener("sesionActualizada", revisarSesion);
    };
  }, [router]);

  return listo ? children : null;
}
