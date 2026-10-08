"use client";
import { useState, useEffect } from 'react';
import useSocket from '../../hooks/useSocket'; // Asegurate que la ruta coincida y sea export default
import '../global.css';

const API_URL = "http://localhost:4000";

export default function AdminPage() {
    // Usamos la destructuración de tu hook para sacar el socket y el estado de conexión
    const { socket, isConnected } = useSocket(API_URL); 
    
    const [mensajeClubes, setMensajeClubes] = useState('');
    
    // ... (el resto del código de estados del formulario sigue igual) ...

    // Escuchamos eventos en tiempo real
    useEffect(() => {
        // Ahora chequeamos que el socket exista y que esté conectado
        if (!socket || !isConnected) return; 

        // Definimos la función que manejará el evento
        const manejarActualizacion = (data) => {
            console.log("Notificación WebSocket recibida:", data.mensaje);
        };

        // Empezamos a escuchar el evento
        socket.on('actualizacionEquipos', manejarActualizacion);

        // Limpieza: dejamos de escuchar el evento cuando el componente se desmonta
        return () => {
            socket.off('actualizacionEquipos', manejarActualizacion);
        };
    }, [socket, isConnected]); // Se re-ejecuta si el socket o el estado cambian
}