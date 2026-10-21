// src/app/layout.jsx
import './global.css';
import SiteHeader from '../components/SiteHeader';

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
        <SiteHeader />
        <hr />
        
        {/* Next reemplaza children por el contenido de la ruta activa, por ejemplo /menu o /wordle. */}
        {children}
      </body>
    </html>
  );
}
