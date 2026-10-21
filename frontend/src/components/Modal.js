"use client";
// Ventana modal que se abre, se cierra y bloquea el click de fondo.

export default function Modal({ abierto, titulo, children, onCerrar }) {
  if (!abierto) return null;
  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <p>{children}</p>
        <button className="btn btn-primary" onClick={onCerrar}>Cerrar</button>
      </div>
    </div>
  );
}
