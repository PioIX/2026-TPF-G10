import Link from "next/link";
import Image from "next/image";

export default function GameCard({ titulo, imagen, href }) {
  return (
    <div className="card">
      <Image src={imagen} alt="" width={240} height={140} className="card-img" />
      <h3>{titulo}</h3>
      <Link href={href} className="btn btn-primary">JUGAR</Link>
    </div>
  );
}
