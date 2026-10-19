import Link from "next/link";

export default function Button({ children, href, variant = "primary", ...props }) {
  const clase = `btn btn-${variant}`;
  if (href) return <Link href={href} className={clase}>{children}</Link>;
  return <button className={clase} {...props}>{children}</button>;
}

