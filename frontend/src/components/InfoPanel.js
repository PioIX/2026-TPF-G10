// Panel común de datos de partida, como país actual, ronda, plantel o intentos.
export default function InfoPanel({ items, className = "estadoJuego" }) {
  return (
    <div className={className}>
      {items.map((it) => (
        <div key={it.label}>
          <strong>{it.label}:</strong> <span id={it.id}>{it.valor}</span>
        </div>
      ))}
    </div>
  );
}
