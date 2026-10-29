// Botón compartido. Con href usa Link de Next; sin href conserva el comportamiento HTML.
import Link from "next/link";

export default function Button({ children, href, variant = "primary", className = "", ...props }) {
  // Las props restantes (type, onClick, disabled, etc.) se pasan al botón nativo.
  const clase = ["btn", `btn-${variant}`, className].filter(Boolean).join(" ");
  if (href) return <Link href={href} className={clase} {...props}>{children}</Link>;
  return <button className={clase} {...props}>{children}</button>;
}

