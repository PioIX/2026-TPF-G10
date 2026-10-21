// Botón común de los formularios/componentes preparados. Con href usa Link de Next; sin href conserva el botón HTML.
import Link from "next/link";

export default function Button({ children, href, variant = "primary", ...props }) {
  // Las props restantes (type, onClick, disabled, etc.) se pasan al botón nativo.
  const clase = `btn btn-${variant}`;
  if (href) return <Link href={href} className={clase}>{children}</Link>;
  return <button className={clase} {...props}>{children}</button>;
}

