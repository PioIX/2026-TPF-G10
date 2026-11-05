// Panel de datos de una partida, usado para mostrar el país, la ronda y el plantel.
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
