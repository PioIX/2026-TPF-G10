// La validación de cada letra contempla repeticiones sin marcar más apariciones de las disponibles.
export function estadoLetra(intento, i, secreta) {
  // Cuenta letras repetidas para no pintar como presentes más veces de las que aparecen en la palabra secreta.
  if (intento[i] === secreta[i]) return "ok";
  const sobrantes = [...secreta].filter((l, k) => l !== intento[k]);
  const yaMarcadas = [...intento].slice(0, i).filter((l, k) => l === intento[i] && l !== secreta[k]).length;
  return sobrantes.filter((l) => l === intento[i]).length > yaMarcadas ? "cerca" : "no";
}

export default function WordleBoard({ filas }) {
  return (
    <div id="tablero" className="tablero">
      {filas.map((fila, indiceFila) => (
        <div className="fila" key={indiceFila}>
          {fila.map((celda, indiceColumna) => (
            <div
              key={indiceColumna}
              className="letra"
              style={{ background: celda.color }}
            >
              {celda.letra}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
