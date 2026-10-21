// src/app/layout.jsx
import Link from 'next/link';
import Image from 'next/image';
import './global.css';

export const metadata = {
  title: 'Fulbo 11',
  description: 'Minijuegos de fútbol: Fulbo 11, Wordle, Grid y más',
};

// Layout compartido: define idioma, encabezado y hoja de estilos para las rutas.
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header>
          {/* El título puede ser dinámico luego, por ahora dejamos el genérico */}
          <h1>FULBO 11</h1>
          <Link href="/">
            <Image src="/logo.png" alt="Logo Fulbo 11" width={80} height={80} loading="eager" />
          </Link>
        </header>
        <hr />
        
        {/* Aquí adentro se inyectará el contenido de cada página (ej. el menú, wordle, etc.) */}
        {children}
      </body>
    </html>
  );
}
