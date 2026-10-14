export function estadoLetra(intento, i, secreta) {
  if (intento[i] === secreta[i]) return "ok";
  const sobrantes = [...secreta].filter((l, k) => l !== intento[k]);
  const yaMarcadas = [...intento].slice(0, i).filter((l, k) => l === intento[i] && l !== secreta[k]).length;
  return sobrantes.filter((l) => l === intento[i]).length > yaMarcadas ? "cerca" : "no";
}

export default function WordleBoard({ intentos, actual, max = 6, secreta }) {
  return (
    <div className="tablero">
      {Array.from({ length: max }, (_, i) => {
        const txt = i < intentos.length ? intentos[i] : i === intentos.length ? actual : "";
        return (
          <div className="fila-t" key={i}>
            {Array.from({ length: secreta.length }, (_, c) => (
              <div key={c} className={`celda ${i < intentos.length ? estadoLetra(txt, c, secreta) : ""}`}>
                {txt[c] || ""}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
