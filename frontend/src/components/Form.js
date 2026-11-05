"use client";

// Campo compartido: mantiene una etiqueta accesible y admite inputs controlados o no controlados.
export function Field({
  label,
  name,
  id = name,
  type = "text",
  required = true,
  className = "field",
  inputClassName = "campo",
  hideLabel = false,
  ...rest
}) {
  return (
    <label className={className} htmlFor={id}>
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <input id={id} className={inputClassName} name={name} type={type} required={required} {...rest} />
    </label>
  );
}

// Entrega al callback los valores por nombre y el formulario para que pueda limpiarlo al guardar.
export default function Form({ onSubmit, children, className = "form", ...rest }) {
  return (
    <form
      className={className}
      {...rest}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(Object.fromEntries(new FormData(e.currentTarget)), e.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
