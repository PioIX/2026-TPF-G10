"use client";

import { useEffect, useState } from "react";

// Festejo común para los juegos: aparece al ganar y se retira solo después de un instante.
export default function GoalCelebration() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1750);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="festejoGol" role="status" aria-live="polite">
      <div className="festejoGolTarjeta">
        <span className="festejoGolBalon" aria-hidden="true">⚽</span>
        <span className="festejoGolTexto">
          <strong>¡GOOOL!</strong>
          <span>¡Qué golazo!</span>
        </span>
      </div>
    </div>
  );
}
