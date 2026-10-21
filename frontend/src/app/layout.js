// src/app/layout.jsx
import Link from 'next/link';
import Image from 'next/image';
import './global.css';

// Metadatos compartidos por todas las rutas que usan este layout raíz.
export const metadata = {
  title: 'Fulbo 11',
  description: 'Minijuegos de fútbol: Fulbo 11, Wordle, Grid y más',
};

// Uso: Next lo aplica a todas las páginas. `children` es la ruta actual dentro del marco común.
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header>
          {/* Encabezado compartido por todas las rutas que usan el layout raíz. */}
          <h1>FULBO 11</h1>
          <Link href="/">
            {/* La imagen está sobre el pliegue inicial, por eso se solicita al cargar la página. */}
            <Image src="/logo.png" alt="Logo Fulbo 11" width={80} height={80} loading="eager" />
          </Link>
        </header>
        <hr />
        
        {/* Next reemplaza children por el contenido de la ruta activa, por ejemplo /menu o /wordle. */}
        {children}
      </body>
    </html>
  );
}
