// src/app/login/page.js
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../global.css'; // Importamos el CSS global

const API_URL = "http://localhost:4000";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mensajeModal, setMensajeModal] = useState('');

    const loginUsuario = async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        if (email === "" || password === "") {
            setMensajeModal("Por favor, complete todos los campos.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/usuarios`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const usuarios = await response.json();
            
            // Lógica original de tu script
            const usuarioEncontrado = usuarios.find(u => u.email === email && u.password === password);
            
            if (usuarioEncontrado) {
                setMensajeModal("Inicio de sesión exitoso. Redirigiendo...");
                localStorage.setItem("usuarioId", usuarioEncontrado.id);
                localStorage.setItem("usuarioNombre", usuarioEncontrado.name);
                
                setTimeout(() => {
                    router.push('/'); // Redirige al Menú Principal en Next.js
                }, 2000);
            } else {
                setMensajeModal("Correo o contraseña incorrectos.");
            }
        } catch (error) {
            setMensajeModal("Error al conectar con el servidor: " + error.message);
        }
    };

    return (
        <div>
            {/* ACÁ TU COMPAÑERO PUEDE REEMPLAZAR ESTO POR SU COMPONENTE <Title> */}
            <header>
                <h1>LOGIN - FULBO 11</h1>
            </header>
            <hr />

            <div>
                {/* ACÁ TU COMPAÑERO REEMPLAZARÁ POR SU <Form> */}
                <form className="login" onSubmit={loginUsuario}>
                    <input 
                        type="email" 
                        className="campo" 
                        placeholder="CORREO ELECTRÓNICO:" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} // Guardamos en el estado
                    />

                    <input 
                        type="password" 
                        className="campo" 
                        placeholder="CONTRASEÑA:" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                    />

                    {/* ACÁ TU COMPAÑERO REEMPLAZARÁ POR SU <Button> */}
                    <button type="submit" className="btn">
                        INICIAR SESIÓN
                    </button>

                    <button 
                        type="button" 
                        className="btn" 
                        onClick={() => router.push('/registro')}
                    >
                        REGISTRARSE
                    </button>
                </form>
            </div>

            {/* Simulación rápida de tu UI Modal para mostrar errores/éxitos */}
            {mensajeModal && (
                <div style={{ marginTop: '20px', padding: '10px', background: '#ffbe00', color: '#000', borderRadius: '8px' }}>
                    <strong>{mensajeModal}</strong>
                </div>
            )}
        </div>
    );
}