"use client";

// Diálogo controlado por su padre para mostrar avisos y cerrarlos con una acción.
export default function Modal({ abierto, titulo, children, onCerrar }) {
  // El padre decide cuándo existe el diálogo; devolver null lo quita del árbol de la página.
  if (!abierto) return null;

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <section
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-titulo">{titulo}</h2>
        <p>{children}</p>
        <button className="btn-cerrar-modal" type="button" onClick={onCerrar}>
          Cerrar
        </button>
      </section>
    </div>
  );
}
