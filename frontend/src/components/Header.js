// Encabezado de página con título y acceso al menú.
import Link from "next/link";
import Title from "./Title";

export default function Header({ titulo }) {
  return (
    <header className="header">
      <Title>{titulo}</Title>
      <Link href="/menu" className="logo" aria-label="Volver al menú">F11</Link>
    </header>
  );
}
