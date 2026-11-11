// Insignia visual de dificultad: dibuja una pelota por nivel y atenúa las que quedan fuera.
export default function DifficultyBadge({ nivel = 1, max = 3 }) {
  return (
    <div className="dificultad" aria-label={`Dificultad ${nivel} de ${max}`}>
      {/* Array.from crea max marcas; el índice indica si la pelota pertenece al nivel activo. */}
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ opacity: i < nivel ? 1 : 0.25 }}>⚽</span>
      ))}
    </div>
  );
}
