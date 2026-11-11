// Panel común de datos de partida, como país actual, ronda, plantel o intentos.
export default function InfoPanel({ items, className = "estadoJuego" }) {
  return (
    <div className={className}>
      {/* items es un arreglo de { label, valor, id? }; map crea una línea de estado por elemento. */}
      {items.map((it) => (
        <div key={it.label}>
          <strong>{it.label}:</strong> <span id={it.id}>{it.valor}</span>
        </div>
      ))}
    </div>
  );
}
