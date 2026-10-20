// Muestra la galería de compañeros usada como pista del jugador secreto.
// companeros: [{ nombre, imagen }] (5 jugadores con los que compartió equipo)
import Image from "next/image";

// Galería de compañeros que funciona como pista visual del jugador oculto.
export default function LinkGallery({ companeros, revelado = false, jugadorMisterioso }) {
  return (
    <div className="link">
      <div className="jugador-card">{revelado ? jugadorMisterioso : "?"}</div>
      <p>Jugué con estos {companeros.length} jugadores. ¿Quién soy yo?</p>
      <div className="imagenes">
        {companeros.map((c, i) => (
          <figure key={i}>
            {c.imagen ? <Image src={c.imagen} alt={c.nombre} width={120} height={120} unoptimized /> : <div className="img-vacia">{i + 1}</div>}
            {revelado && <figcaption>{c.nombre}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}
