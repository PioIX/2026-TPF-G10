// filas: [{ nombre, bandera, puntos, revelado }]
// Si "revelado" es false, la fila se muestra vacía (modo Top 10).
export default function ScoreTable({ filas, mostrarPuntos = false }) {
  return (
    <div className="tabla">
      {filas.map((f, i) => {
        const visible = f.revelado !== false;
        return (
          <div key={i} className={`rank ${visible ? "rev" : ""}`}>
            <div className="rank-pos">{i + 1}</div>
            <div className="rank-flag">{visible ? f.bandera : ""}</div>
            <div className="rank-nom">{visible ? f.nombre : ""}</div>
            {mostrarPuntos && <div className="rank-pts">{visible ? f.puntos : ""}</div>}
          </div>
        );
      })}
    </div>
  );
}
