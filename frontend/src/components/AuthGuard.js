"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Envolvé con esto las páginas que requieren sesión (menú y juegos).
export default function AuthGuard({ children }) {
  const router = useRouter();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("usuarioId")) setListo(true);
    else router.replace("/login");
  }, [router]);

  return listo ? children : null;
}
