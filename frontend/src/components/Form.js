"use client";

export function Field({ label, name, type = "text", required = true, ...rest }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="campo" name={name} type={type} required={required} {...rest} />
    </label>
  );
}

// onSubmit recibe un objeto { campo: valor } con todo lo que haya en el formulario.
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
