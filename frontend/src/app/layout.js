// src/app/layout.jsx
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Fulbo 11',
  description: 'Minijuegos de fútbol: Fulbo 11, Wordle, Grid y más',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header>
          {/* El título puede ser dinámico luego, por ahora dejamos el genérico */}
          <h1>FULBO 11</h1>
          <Link href="/">
            <img src="/img/logo.png" alt="Logo Fulbo 11" />
          </Link>
        </header>
        <hr />
        
        {/* Aquí adentro se inyectará el contenido de cada página (ej. el menú, wordle, etc.) */}
        {children}
      </body>
    </html>
  );
}