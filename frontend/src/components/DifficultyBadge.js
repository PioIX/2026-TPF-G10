// Insignia visual de dificultad para Adivina el jugador.
// Dibuja una pelota por nivel y atenúa las que quedan fuera de la dificultad elegida.
export default function DifficultyBadge({ nivel = 1, max = 3 }) {
  return (
    <div className="dificultad" aria-label={`Dificultad ${nivel} de ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ opacity: i < nivel ? 1 : 0.25 }}>⚽</span>
      ))}
    </div>
  );
}
