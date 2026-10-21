// Galería visual preparada como otra modalidad de Adivina el jugador; la partida activa no la usa.
// companeros: [{ nombre, imagen }] (5 jugadores con los que compartió equipo)
import Image from "next/image";

// Recibe la lista de compañeros y, al revelarse, muestra sus nombres y el jugador misterioso.
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
