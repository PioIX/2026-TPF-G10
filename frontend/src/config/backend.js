// Cambiá esta IP por la de la computadora que ejecuta el backend.
// Usá "localhost" cuando frontend y backend corran en la misma computadora.
// Dirección base que usa el frontend para llamar al backend HTTP y al servicio de sockets.
export const BACKEND_IP = "localhost";
export const BACKEND_PORT = 4000;

// URL armada en un solo lugar para que todos los módulos apunten al mismo servidor.
export const BACKEND_URL = `http://${BACKEND_IP}:${BACKEND_PORT}`;
