"use client";
// Ventana modal genérica; la ruta /login actual muestra su propio cartel y aún no importa este componente.

export default function Modal({ abierto, titulo, children, onCerrar }) {
  // Si está cerrada no genera nodos; si está abierta, el clic interno no se propaga al fondo.
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
