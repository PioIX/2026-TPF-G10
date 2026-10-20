// Representa el nivel de dificultad con una cantidad variable de pelotas.
export default function DifficultyBadge({ nivel = 1, max = 3 }) {
  return (
    <div className="dificultad" aria-label={`Dificultad ${nivel} de ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ opacity: i < nivel ? 1 : 0.25 }}>⚽</span>
      ))}
    </div>
  );
}
