"use client";
// Primitivas de formulario usadas por AdminPlayerForm y ClubForm; esos formularios aún no están conectados a /admin.

// Field relaciona una etiqueta con el input y pasa al input las propiedades HTML adicionales.
export function Field({ label, name, type = "text", required = true, ...rest }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="campo" name={name} type={type} required={required} {...rest} />
    </label>
  );
}

// Al enviar, FormData lee los inputs por name y Object.fromEntries crea un objeto simple para onSubmit.
// Son APIs nativas del navegador/JavaScript que no están desarrolladas en los apuntes.
export default function Form({ onSubmit, children, className = "form" }) {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Object.fromEntries(new FormData(e.currentTarget)), e.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
