// Botón compartido: con href navega usando Link de Next; sin href ejecuta la acción HTML.
import Link from "next/link";

export default function Button({ children, href, variant = "primary", className = "", ...props }) {
  // filter(Boolean) quita clases vacías y join arma una sola cadena para className.
  const clase = ["btn", `btn-${variant}`, className].filter(Boolean).join(" ");
  // Las props restantes (type, onClick, disabled, etc.) se pasan al elemento final.
  if (href) return <Link href={href} className={clase} {...props}>{children}</Link>;
  return <button className={clase} {...props}>{children}</button>;
}

