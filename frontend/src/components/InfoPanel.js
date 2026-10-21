// Panel reutilizable de datos de partida; la página de Fútbol 11 hoy imprime esos datos en su propio JSX.
// items: [{ label: "País", valor: "Argentina" }, ...]  (Fulbo 11: país, ronda, colocados)
export default function InfoPanel({ items }) {
  return (
    <div className="estado">
      {items.map((it) => <span key={it.label}><b>{it.label}:</b> {it.valor}</span>)}
    </div>
  );
}
