
export const metadata = {
  title: "",
  description: "",
};

export default function RootLayout({ children }) {
  // children es la página actual que Next.js inserta dentro del layout.
  return (
    <html lang="es">
      <body>
        <div>
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
