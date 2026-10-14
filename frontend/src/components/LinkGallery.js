// companeros: [{ nombre, imagen }] (5 jugadores con los que compartió equipo)
export default function LinkGallery({ companeros, revelado = false, jugadorMisterioso }) {
  return (
    <div className="link">
      <div className="jugador-card">{revelado ? jugadorMisterioso : "?"}</div>
      <p>Jugué con estos {companeros.length} jugadores. ¿Quién soy yo?</p>
      <div className="imagenes">
        {companeros.map((c, i) => (
          <figure key={i}>
            {c.imagen ? <img src={c.imagen} alt={c.nombre} /> : <div className="img-vacia">{i + 1}</div>}
            {revelado && <figcaption>{c.nombre}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}