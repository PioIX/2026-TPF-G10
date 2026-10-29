/*
 * Punto de entrada del backend.
 *
 * En el mismo proceso hay dos formas de atender al navegador:
 * - Express responde pedidos HTTP puntuales (login, datos de jugadores, altas de admin).
 * - Socket.IO mantiene conexiones abiertas y entrega eventos en tiempo real (salas y chat).
 *
 * Los navegadores NO se conectan entre sí: cada uno se conecta a este servidor.
 * El servidor decide a qué socket o grupo de sockets reenviar cada evento.
 * MySQL se consulta desde acá; las páginas nunca abren una conexión directa a la base.
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http'); // Necesario para Socket.IO
const crypto = require('node:crypto'); // Módulo nativo de Node.js, usado para sortear códigos de sala.
const { Server } = require('socket.io'); // Importamos Socket.IO
const { realizarQuery } = require('./modulos/mysql');

// Express define las rutas HTTP. Socket.IO se adjunta al mismo servidor HTTP más abajo,
// así REST y sockets escuchan en el mismo puerto y proceso del backend.
const app = express();
const port = process.env.PORT || 4000;
const cacheImagenesExternas = new Map();

function normalizarClaveImagen(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
}

// Node crea el servidor HTTP que ejecuta Express; Socket.IO se conectará a este objeto.
const server = http.createServer(app);

const opcionesCors = {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

// Inicializa el servidor Socket.IO sobre el mismo HTTP server.
// CORS permite que el frontend (normalmente puerto 3000) se conecte al backend (4000).
const io = new Server(server, {
  cors: opcionesCors
});

// Middleware HTTP de Express: interpreta cuerpos de formularios/JSON y habilita CORS.
// Estos middleware afectan las rutas HTTP; Socket.IO tiene su configuración CORS arriba.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors(opcionesCors));

// Middleware del handshake Socket.IO: corre antes de aceptar cada conexión nueva.
// El cliente manda `query.userId` desde localStorage; no es el socket.id ni una sesión/cookie.
// Buscamos en MySQL y guardamos un perfil público en socket.data.user para reutilizarlo
// en las salas y el chat. Si falta/no sirve el ID, el socket igual conecta como anónimo;
// las acciones que requieren usuario (por ejemplo, chat) deciden luego si lo rechazan.
io.use(async (socket, next) => {
    const userId = Number(socket.handshake.query?.userId);
    if (!Number.isSafeInteger(userId) || userId < 1) {
        socket.data.user = null;
        return next(); // Permite socket anónimo; cada evento decide luego si exige usuario.
    }

    try {
        const usuarios = await realizarQuery(
            'SELECT id_usuario, usuario AS name, email FROM Usuarios WHERE id_usuario = ?',
            [userId]
        );
        socket.data.user = usuarios?.[0] || null;
        return next(); // Continúa al evento connection con el perfil público asociado a este socket.
    } catch (error) {
        return next(error);
    }
});


// Estado temporal de tiempo real (no se persiste en MySQL): al reiniciar el proceso se borra.
// `salas` busca una sala por su código; `juegosDisponibles` valida identificadores admitidos.
// `historialChat` conserva solo los mensajes recientes mientras corre este proceso.
// --- CONFIGURACIÓN DE WEBSOCKETS ---
const juegosDisponibles = new Set([
    'wordle',
    'adivinaeljugador',
    'futbol11',
    'grid'
]);
const alfabetoCodigos = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const maximoJugadoresPorSala = 2;
const salas = new Map();
const historialChat = [];
const ultimoMensajeChat = new Map();
const salaChatGlobal = 'chat:global';

// Crea un código corto para compartir. randomInt elige seis símbolos del alfabeto,
// que evita caracteres fáciles de confundir; el bucle evita repetir un código activo.
function generarCodigoSala() {
    let codigo;
    do {
        // randomInt selecciona cada carácter de forma segura dentro del alfabeto definido.
        codigo = Array.from({ length: 6 }, () => (
            alfabetoCodigos[crypto.randomInt(alfabetoCodigos.length)]
        )).join('');
    } while (salas.has(codigo));
    console.log(codigo)
    return codigo;
}

// Convierte el objeto interno de sala al formato público que reciben los navegadores.
// No incluye socketId ni otros detalles internos del servidor.
function obtenerEstadoSala(sala) {
    return {
        room: sala.codigo,
        game: sala.juego,
        status: sala.estado,
        players: sala.jugadores.map((jugador) => ({
            position: jugador.posicion,
            name: jugador.nombre,
            host: jugador.anfitrion
        }))
    };
}

// Broadcast a todos los sockets que ya están dentro del código de sala, incluido el emisor.
function emitirEstadoSala(sala) {
    io.to(sala.codigo).emit('roomUpdated', obtenerEstadoSala(sala)); // Todos en la sala, incluido quien disparó el cambio.
}

// Rutina común para salir manualmente, cambiar de sala o desconectarse.
// Busca la sala desde socket.data.room (el cliente no puede elegir qué sala liberar),
// quita el socket de la lista y de la sala Socket.IO, y luego actualiza/cierra el estado.
function retirarDeSala(socket, motivo) {
    const codigo = socket.data.room;
    const sala = codigo ? salas.get(codigo) : null;
    // Registra el ciclo de vida de la sala para identificar cierres que invalidan un código compartido.
    console.log(`[salas] Socket ${socket.id} sale de ${codigo || 'ninguna sala'}: ${motivo}.`);
    if (!sala) {
        socket.data.room = null;
        return;
    }

    // La sala identifica a cada integrante por la conexión Socket.IO abierta en ese navegador.
    const indice = sala.jugadores.findIndex((jugador) => jugador.socketId === socket.id);
    const jugador = indice === -1 ? null : sala.jugadores.splice(indice, 1)[0];
    socket.leave(sala.codigo); // Lo quita del grupo Socket.IO; también lo quitamos de sala.jugadores arriba.

    if (sala.jugadores.length === 0) {
        // Sin participantes, el código deja de existir y podrá generarse de nuevo en el futuro.
        salas.delete(sala.codigo);
        // La última conexión ya salió; hoy el cliente que cierra se limpia localmente y no queda
        // nadie dentro para recibir este broadcast. El código se elimina del Map de todos modos.
        io.to(sala.codigo).emit('roomClosed', { room: sala.codigo });
    } else if (jugador) {
        // Si queda una persona, la partida termina y esa persona vuelve a ser anfitriona
        // de una sala en espera, lista para recibir a alguien más.
        sala.estado = 'esperando';
        sala.jugadores[0].posicion = 1;
        sala.jugadores[0].anfitrion = true;
        // io.to incluye a quienes siguen en el grupo (el rival), no al socket que ya hizo leave.
        io.to(sala.codigo).emit('roomPlayerLeft', {
            position: jugador.posicion,
            reason: motivo
        });
        emitirEstadoSala(sala);
    }

    socket.data.room = null;
}

/*
 * Contrato de `sendProgress`.
 * Cada página de juego crea su objeto `progress`, pero el backend nunca reenvía ese objeto
 * directamente: arma uno nuevo con campos permitidos para el juego de la sala.
 *
 * Formatos públicos actuales:
 * - wordle: cantidad/fin/resultado y tablero coloreado (no la palabra secreta).
 * - adivinaeljugador: preguntas/fin/resultado, pista y respuestas filtradas (no el nombre acertado).
 * - futbol11: cantidad/fin, formación visible y país actual.
 * - grid: cantidad/puntaje/fin, encabezados y celdas ya reveladas.
 *
 * Esto valida estructura y límites para la interfaz; no vuelve autoritativo al backend:
 * el servidor no ejecuta las reglas ni comprueba si una respuesta del cliente es verdadera.
 */
function limpiarProgreso(juego, progreso) {
    if (!progreso || typeof progreso !== 'object' || Array.isArray(progreso)) return null;

    // Rechaza cantidades fuera del rango previsto antes de construir el progreso público.
    const estaEnRango = (valor, minimo, maximo) => (
        Number.isInteger(valor) && valor >= minimo && valor <= maximo
    );

    // Wordle: valida hasta seis filas, letras A-Z y los tres colores conocidos.
    if (juego === 'wordle' && estaEnRango(progreso.intentosUsados, 0, 6) && typeof progreso.terminado === 'boolean') {
        const limpio = {
            intentosUsados: progreso.intentosUsados,
            terminado: progreso.terminado,
            gano: progreso.terminado ? Boolean(progreso.gano) : false
        };

        // Comparte el tablero visual validado, sin enviar la palabra que se debe adivinar.
        if (Array.isArray(progreso.tablero) && progreso.tablero.length <= 6) {
            const coloresPermitidos = new Set(['transparent', '#4caf50', '#f1c40f', '#7f8c8d']);
            const tableroLimpio = progreso.tablero.map((fila) => {
                if (!Array.isArray(fila) || fila.length > 8) return null;
                const celdas = fila.map((celda) => {
                    if (!celda || typeof celda.letra !== 'string' || !/^[A-Z_]$/.test(celda.letra)) return null;
                    if (!coloresPermitidos.has(celda.color)) return null;
                    return { letra: celda.letra, color: celda.color };
                });
                return celdas.some((celda) => celda === null) ? null : celdas;
            });
            if (!tableroLimpio.some((fila) => fila === null)) limpio.tablero = tableroLimpio;
        }

        return limpio;
    }

    // Adivina: comparte cantidad, pista y preguntas; filtra el nombre si alguien acertó.
    if (juego === 'adivinaeljugador' && estaEnRango(progreso.preguntasUsadas, 0, 10) && typeof progreso.terminado === 'boolean') {
        const limpio = {
            preguntasUsadas: progreso.preguntasUsadas,
            terminado: progreso.terminado,
            adivino: progreso.terminado ? Boolean(progreso.adivino) : false
        };

        // Muestra preguntas y fallos del rival, pero filtra el mensaje con el nombre acertado.
        if (Array.isArray(progreso.respuestas)) {
            limpio.respuestas = progreso.respuestas
                .filter((respuesta) => typeof respuesta === 'string' && !respuesta.startsWith('✅ ACIERTO:'))
                .slice(0, 10)
                .map((respuesta) => respuesta.slice(0, 180));
        }
        if (typeof progreso.pistaActiva === 'boolean') limpio.pistaActiva = progreso.pistaActiva;
        return limpio;
    }

    // Fútbol 11: transmite los once casilleros visibles y el país de la ronda.
    if (juego === 'futbol11' && estaEnRango(progreso.jugadoresColocados, 0, 11) && typeof progreso.terminado === 'boolean') {
        const limpio = {
            jugadoresColocados: progreso.jugadoresColocados,
            terminado: progreso.terminado
        };

        // Los nombres ya colocados y el país actual forman parte de la pantalla pública.
        if (Array.isArray(progreso.formacion) && progreso.formacion.length === 11) {
            limpio.formacion = progreso.formacion.map((nombre) => (
                typeof nombre === 'string' ? nombre.slice(0, 64) : ''
            ));
        }
        if (typeof progreso.paisActual === 'string') limpio.paisActual = progreso.paisActual.slice(0, 64);
        return limpio;
    }

    // Grid: comparte los encabezados y marcas de celdas, no los jugadores que quedan por responder.
    if (juego === 'grid' && estaEnRango(progreso.celdasCompletadas, 0, 9)) {
        const puntajeValido = progreso.puntaje === undefined || estaEnRango(progreso.puntaje, 0, 100);
        if (!puntajeValido || typeof progreso.terminado !== 'boolean') return null;

        const limpio = {
            celdasCompletadas: progreso.celdasCompletadas,
            puntaje: progreso.puntaje,
            terminado: progreso.terminado
        };

        // Envía encabezados y respuestas ya reveladas, nunca las combinaciones pendientes.
        if (Array.isArray(progreso.filas) && progreso.filas.length === 3 && Array.isArray(progreso.columnas) && progreso.columnas.length === 3) {
            limpio.filas = progreso.filas.map((valor) => String(valor).slice(0, 64));
            limpio.columnas = progreso.columnas.map((valor) => String(valor).slice(0, 64));
        }
        if (progreso.celdasReveladas && typeof progreso.celdasReveladas === 'object' && !Array.isArray(progreso.celdasReveladas)) {
            limpio.celdasReveladas = {};
            Object.entries(progreso.celdasReveladas).slice(0, 9).forEach(([clave, valor]) => {
                if (/^r[0-2]_c[0-2]$/.test(clave) && typeof valor === 'string') {
                    limpio.celdasReveladas[clave] = valor.slice(0, 64);
                }
            });
        }
        return limpio;
    }

    return null;
}

/*
 * Esta función se ejecuta una vez por cada socket nuevo. `socket` representa esa conexión:
 * tiene un socket.id propio, datos asociados en socket.data, listeners y membresías de sala.
 *
 * Convención de eventos:
 * - `socket.on(nombre, handler)`: registrar qué hace el servidor cuando el cliente emite ese evento.
 * - `socket.emit(...)`: contestar/enviar un evento a esa conexión concreta.
 * - `io.to(sala).emit(...)`: enviar a todos los miembros de una sala, también al emisor si pertenece.
 * - `socket.to(sala).emit(...)`: enviar a los demás miembros de una sala, sin incluir al emisor.
 * - `confirmar(...)`: callback de acuse para quien hizo la petición; no es un broadcast.
 *
 * `pingAll` es un ejemplo global de broadcast, pero el chat usa su propia sala `chat:global`.
 */
// Este bloque se registra una vez por cada conexión nueva del navegador.
io.on('connection', (socket) => {
  // Este bloque corre una vez por conexión. Dos pestañas/personas producen dos socket.id distintos.
  console.log(`Nuevo cliente conectado vía WebSocket: ${socket.id}`);

  // Evento de ejemplo: el cliente manda pingAll con cualquier dato y el backend lo retransmite
  // a TODOS los sockets conectados mediante io.emit. No participa en las partidas ni en el chat.
  socket.on('pingAll', (data) => {
      io.emit('pingAll', { event: 'Ping to all', message: data }); // io.emit no filtra por sala: llega a todos.
  });

  // Evento entrante: createRoom { game, name }.
  // `game` debe coincidir con juegosDisponibles. `name` es respaldo si el socket no tiene perfil.
  // El backend crea una sala en memoria, añade este socket como anfitrión y responde por callback:
  // { ok: true, room: { room, game, status: "esperando", players } }.
  // También manda roomUpdated a los miembros (en ese momento, el creador).
  socket.on('createRoom', (data = {}, confirmar = () => {}) => {
      if (!juegosDisponibles.has(data.game)) {
          return confirmar({ ok: false, error: 'Ese juego no está disponible.' });
      }

      if (socket.data.room) retirarDeSala(socket, 'cambio de sala');

      const codigo = generarCodigoSala();
      const usuario = socket.data.user || {};
      // Estado interno. socketId sirve para reconocer conexiones; obtenerEstadoSala no lo expone.
      const sala = {
          codigo,
          juego: data.game,
          estado: 'esperando',
          jugadores: [{
              posicion: 1,
              socketId: socket.id,
              nombre: String(usuario.name || usuario.nombre || data.name || 'Jugador').trim().slice(0, 32),
              anfitrion: true
          }]
      };

      salas.set(codigo, sala);
      // Las salas viven en memoria mientras este proceso de backend siga activo.
      console.log(`[salas] Creada ${codigo} para ${data.game}. Salas activas: ${salas.size}.`);
      socket.data.room = codigo; // Fuente de verdad de la sala para leaveRoom/sendProgress.
      // Asociación lógica que permite al backend emitir después a esta sala por código.
      socket.join(codigo); // Desde ahora io.to(codigo) puede dirigir mensajes a este anfitrión.
      emitirEstadoSala(sala);
      return confirmar({ ok: true, room: obtenerEstadoSala(sala) }); // ACK privado que permite mostrar el código.
  });

  // Evento entrante: joinRoom { room, game, name }.
  // Se normaliza el código, se valida que exista/sea del juego correcto/tenga lugar y,
  // si todo sale bien, el socket entra en la sala. El callback confirma al que se unió.
  // Además, roomUpdated y roomMatched se emiten a la sala para que ambos lobbies reaccionen.
  socket.on('joinRoom', (data = {}, confirmar = () => {}) => {
      const codigo = String(data.room || '').trim().toUpperCase();
      const sala = salas.get(codigo);

      if (!sala) {
          // Si el anfitrión perdió su conexión o el backend reinició, el mapa ya no tendrá este código.
          console.warn(`[salas] No existe ${codigo}. Salas activas: ${salas.size}.`);
          return confirmar({ ok: false, error: 'No encontramos una sala con ese código.' });
      }
      if (data.game && data.game !== sala.juego) {
          return confirmar({ ok: false, error: 'El código pertenece a otro juego.' });
      }
      if (sala.jugadores.length >= maximoJugadoresPorSala || sala.estado === 'jugando') {
          return confirmar({ ok: false, error: 'La sala ya está completa.' });
      }

      if (socket.data.room) retirarDeSala(socket, 'cambio de sala');

      const usuario = socket.data.user || {};
      sala.jugadores.push({
          posicion: 2,
          socketId: socket.id,
          nombre: String(usuario.name || usuario.nombre || data.name || 'Jugador').trim().slice(0, 32),
          anfitrion: false
      });
      sala.estado = 'jugando';
      socket.data.room = codigo; // El backend mantiene esta relación; el cliente no manda room en sendProgress.
      socket.join(codigo); // El invitado entra al grupo antes de emitir roomMatched.
      emitirEstadoSala(sala);
      io.to(codigo).emit('roomMatched', obtenerEstadoSala(sala)); // El anfitrión se entera por este broadcast.
      return confirmar({ ok: true, room: obtenerEstadoSala(sala) }); // El invitado recibe su ACK aparte.
  });

  // Evento entrante: leaveRoom sin datos. El servidor ya sabe la sala por socket.data.room.
  // Callback de salida: { ok: true, room }. retirarDeSala avisa al rival y libera el lugar.
  socket.on('leaveRoom', (confirmar = () => {}) => {
      const room = socket.data.room || null;
      retirarDeSala(socket, 'salida');
      return confirmar({ ok: true, room }); // Solo informa a quien pidió salir; roomPlayerLeft avisa al rival.
  });

  // Evento entrante: sendProgress { progress }.
  // La sala no se acepta desde el payload: se toma de socket.data.room para limitar al jugador
  // a la sala a la que realmente se unió. Se valida estado, formato de progreso y pertenencia.
  // Luego opponentProgress llega SOLO al otro socket de la sala; el emisor recibe { ok: true }.
  socket.on('sendProgress', (data = {}, confirmar = () => {}) => {
      const room = socket.data.room;
      const sala = salas.get(room);
      if (!sala || sala.estado !== 'jugando') {
          return confirmar({ ok: false, error: 'No hay una partida en curso.' });
      }

      // El tipo de juego sale de la sala guardada en el servidor, no de un game enviado por el cliente.
      const progreso = limpiarProgreso(sala.juego, data.progress);
      if (!progreso) {
          return confirmar({ ok: false, error: 'El progreso enviado no es válido.' });
      }

      const jugador = sala.jugadores.find((integrante) => integrante.socketId === socket.id);
      if (!jugador) {
          return confirmar({ ok: false, error: 'No formas parte de esta sala.' });
      }

      // El prefijo socket.to excluye a este jugador; con salas de 2, lo recibe solo su rival.
      socket.to(room).emit('opponentProgress', {
          position: jugador.posicion,
          name: jugador.nombre,
          progress: progreso,
          updatedAt: Date.now()
      });
      return confirmar({ ok: true }); // ACK de validación al emisor; no confirma que el rival lo haya leído.
  });

  // Evento entrante: joinGlobalChat sin payload. El perfil vino en el handshake del socket.
  // Si existe, entra en la sala exclusiva `chat:global`; luego recibe chat-messages:
  // { user, room, messages }. No se usa pingAll porque no queremos enviar chat a sockets
  // que no se hayan unido al canal.
  socket.on('joinGlobalChat', (confirmar = () => {}) => {
      if (!socket.data.user) {
          return confirmar({ ok: false, error: 'Iniciá sesión para usar el chat.' });
      }

      socket.join(salaChatGlobal); // La pertenencia controla quién podrá enviar/recibir mensajes del canal.
      // Historial solo a este socket. No es broadcast: los mensajes futuros sí irán a toda la sala.
      socket.emit('chat-messages', { // Unicast: entrega el historial solo a quien acaba de unirse.
          user: socket.data.user,
          room: salaChatGlobal,
          messages: historialChat
      });
      return confirmar({ ok: true });
  });

  // Evento entrante: sendMessage { message }.
  // Solo acepta sockets con perfil y membresía en chat:global; recorta espacios, limita a 500
  // caracteres y exige 500 ms entre mensajes del mismo socket. La confirmación es privada;
  // newMessage se emite al canal para que cada GlobalChat actualice su pantalla.
  socket.on('sendMessage', (data = {}, confirmar = () => {}) => {
      const texto = typeof data.message === 'string' ? data.message.trim() : '';
      const ahora = Date.now();

      if (!socket.data.user || !socket.rooms.has(salaChatGlobal)) {
          return confirmar({ ok: false, error: 'Unite al chat con tu usuario.' });
      }
      if (!texto || texto.length > 500) {
          return confirmar({ ok: false, error: 'El mensaje debe tener entre 1 y 500 caracteres.' });
      }
      if (ahora - (ultimoMensajeChat.get(socket.id) || 0) < 500) {
          return confirmar({ ok: false, error: 'Esperá un momento antes de enviar otro mensaje.' });
      }

      ultimoMensajeChat.set(socket.id, ahora);
      // El autor se toma del perfil resuelto por el backend, no del texto que manda el cliente.
      const mensaje = {
          id: crypto.randomUUID(),
          user: socket.data.user,
          message: texto,
          createdAt: new Date(ahora).toISOString()
      };
      historialChat.push(mensaje);
      if (historialChat.length > 50) historialChat.shift();

      // Guarda los últimos 50 mensajes solo en memoria y los transmite a miembros del canal.
      io.to(salaChatGlobal).emit('newMessage', { // El emisor también está en la sala y recibe su propio mensaje.
          room: salaChatGlobal,
          message: mensaje
      });
      return confirmar({ ok: true, message: mensaje }); // ACK al emisor, separado del newMessage al canal.
  });

  // Evento de ciclo de vida de Socket.IO: se ejecuta al cerrar pestaña, perder transporte
  // o desconectar explícitamente. Las salas Socket.IO se limpian y retiramos la sala de juego
  // de nuestro Map para que el rival pueda volver a esperar a otra persona.
  socket.on('disconnect', (motivo) => {
      ultimoMensajeChat.delete(socket.id);
      // Socket.IO ya retira memberships de su adapter; nuestro Map `salas` es dato propio,
      // así que retirarDeSala también debe borrar el jugador de la estructura de la aplicación.
      retirarDeSala(socket, 'desconexión');
      // El motivo y el código ayudan a ver si la sala se perdió por cierre del cliente o del transporte.
      console.log(`[socket] Disconnect ${socket.id}: ${motivo}.`);
  });
});
// ------------------------------------


/*
 * --- RUTAS HTTP (FETCH) ---
 * Esta parte es independiente de los handlers Socket.IO de arriba: cada función de Express
 * recibe una solicitud, puede consultar MySQL mediante realizarQuery y devuelve una respuesta.
 * En el frontend se usa fetch() para estas operaciones puntuales.
 *
 * Lecturas usadas por los juegos: /jugadores, /grid, /imagen y datos asociados.
 * Acceso/registro: POST /login y POST /usuarios.
 * Administración: POST /jugadores, /datos, /estadisticas, /trayectoria y /equipos.
 */

// Ruta de estado simple: permite comprobar que Express responde por HTTP.
app.get('/', function(req, res){
    res.status(200).send({
        message: 'Backend Funcionando - Listo para Next.js!'
    });
});

// Pedidos GET
// Devuelve información pública de usuarios, sin enviar contraseñas al navegador.
app.get('/usuarios', async function(req,res){
    // El parámetro `id` filtra por la columna id_usuario definida en creacion_tablas.sql.
    let respuesta;
    if (req.query.id != undefined) {
        const id = Number(req.query.id);
        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ error: 'El ID de usuario no es válido.' });
        }
        respuesta = await realizarQuery(
            'SELECT id_usuario, usuario AS name, email FROM Usuarios WHERE id_usuario = ?',
            [id]
        );
    } else {
        // Los datos públicos no incluyen la contraseña almacenada en la tabla.
        respuesta = await realizarQuery("SELECT id_usuario, usuario AS name, email FROM Usuarios");
    }    
    res.send(respuesta);
})

// Login HTTP: recibe { email, password }, consulta el usuario en MySQL y compara la contraseña.
// Si coincide devuelve { id, name, email }; el frontend guarda id/name y luego los usa
// para identificarse en el handshake Socket.IO. Esta respuesta no crea una sesión del servidor.
app.post('/login', async function(req, res) {
    try {
        const usuarios = await realizarQuery(
            'SELECT id_usuario, usuario AS name, email, contraseña AS password FROM Usuarios WHERE email = ?',
            [req.body.email]
        ) || [];
        const usuario = usuarios.find((fila) => fila.password === req.body.password);

        if (!usuario) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }

        return res.json({
            id: usuario.id_usuario,
            name: usuario.name,
            email: usuario.email
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al validar las credenciales.' });
    }
});

// Consulta datos personales, estadísticas y clubes vinculados a un jugador.
app.get('/datos', async function(req,res){
    // Los INNER JOIN reúnen atributos, estadísticas, clubes y años en cada fila devuelta.
    // Un jugador con varios clubes aparece varias veces porque tiene varias filas de Trayectoria.
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Datos INNER JOIN Estadisticas on Estadisticas.id_jugador = Datos.id_jugador INNER JOIN Jugadores on Jugadores.id_jugador = Datos.id_jugador INNER JOIN Trayectoria on Trayectoria.id_jugador = Jugadores.id_jugador INNER JOIN Equipos on Equipos.id_equipo = Trayectoria.id_equipo WHERE Jugadores.id_jugador=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Datos INNER JOIN Estadisticas on Estadisticas.id_jugador = Datos.id_jugador INNER JOIN Jugadores on Jugadores.id_jugador = Datos.id_jugador INNER JOIN Trayectoria on Trayectoria.id_jugador = Jugadores.id_jugador INNER JOIN Equipos on Equipos.id_equipo = Trayectoria.id_equipo");
    }    
    res.send(respuesta);
})

// Devuelve estadísticas individuales o las de todos los jugadores.
app.get('/estadisticas', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Estadisticas WHERE id_estadistica=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Estadisticas");
    }    
    res.send(respuesta);
})

// Devuelve jugadores con sus datos básicos y trayectoria de clubes.
// Los juegos llaman este endpoint por fetch para cargar sus datos; las jugadas online no pasan por aquí.
app.get('/jugadores', async function(req,res){
    // Este JOIN también devuelve una fila por registro de trayectoria; el frontend agrupa por id_jugador.
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT Jugadores.id_jugador, Jugadores.nombre, Jugadores.apellido, Jugadores.pais, Jugadores.posicion, Jugadores.liga_actual, Jugadores.id_equipo AS id_equipo_actual, EquipoActual.nombre_equipo AS club_actual, Datos.edad, Datos.altura, Equipos.nombre_equipo, Trayectoria.anio_ingreso, Trayectoria.anio_traspaso FROM Jugadores LEFT JOIN Equipos AS EquipoActual ON EquipoActual.id_equipo = Jugadores.id_equipo LEFT JOIN Datos ON Datos.id_jugador = Jugadores.id_jugador LEFT JOIN Trayectoria ON Trayectoria.id_jugador = Jugadores.id_jugador LEFT JOIN Equipos ON Equipos.id_equipo = Trayectoria.id_equipo WHERE Jugadores.id_jugador=${req.query.id}`);
    } else {
        respuesta = await realizarQuery("SELECT Jugadores.id_jugador, Jugadores.nombre, Jugadores.apellido, Jugadores.pais, Jugadores.posicion, Jugadores.liga_actual, Jugadores.id_equipo AS id_equipo_actual, EquipoActual.nombre_equipo AS club_actual, Datos.edad, Datos.altura, Equipos.nombre_equipo, Trayectoria.anio_ingreso, Trayectoria.anio_traspaso FROM Jugadores LEFT JOIN Equipos AS EquipoActual ON EquipoActual.id_equipo = Jugadores.id_equipo LEFT JOIN Datos ON Datos.id_jugador = Jugadores.id_jugador LEFT JOIN Trayectoria ON Trayectoria.id_jugador = Jugadores.id_jugador LEFT JOIN Equipos ON Equipos.id_equipo = Trayectoria.id_equipo");
    }    
    res.send(respuesta);
})

// Busca fotos y escudos desde el backend para evitar depender del acceso del navegador a TheSportsDB.
app.get('/imagen', async function(req, res) {
    const tipo = req.query.tipo;
    const nombre = String(req.query.nombre || '').trim();
    if (!['jugador', 'equipo'].includes(tipo) || !nombre || nombre.length > 120) {
        return res.status(400).json({ imagen: '' });
    }

    const clave = `${tipo}:${normalizarClaveImagen(nombre)}`;
    if (cacheImagenesExternas.has(clave)) {
        return res.json({ imagen: cacheImagenesExternas.get(clave) });
    }

    const parametro = tipo === 'jugador' ? 'p' : 't';
    const listaResultados = tipo === 'jugador' ? 'player' : 'teams';
    const campoNombre = tipo === 'jugador' ? 'strPlayer' : 'strTeam';
    const camposImagen = tipo === 'jugador'
        ? ['strCutout', 'strThumb']
        : ['strBadge', 'strThumb'];
    const url = `https://www.thesportsdb.com/api/v1/json/3/search${tipo === 'jugador' ? 'players' : 'teams'}.php?${parametro}=${encodeURIComponent(nombre)}`;

    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), 8000);
    try {
        const respuestaExterna = await fetch(url, { signal: controlador.signal });
        if (!respuestaExterna.ok) {
            cacheImagenesExternas.set(clave, '');
            return res.json({ imagen: '' });
        }

        const datos = await respuestaExterna.json();
        const resultados = Array.isArray(datos?.[listaResultados]) ? datos[listaResultados] : [];
        const nombreNormalizado = normalizarClaveImagen(nombre);
        const coincidencia = resultados.find((item) =>
            normalizarClaveImagen(item?.[campoNombre]) === nombreNormalizado
        ) || (resultados.length === 1 ? resultados[0] : null);
        const imagen = coincidencia
            ? camposImagen.map((campo) => coincidencia[campo]).find(Boolean) || ''
            : '';

        cacheImagenesExternas.set(clave, imagen);
        return res.json({ imagen });
    } catch (error) {
        cacheImagenesExternas.set(clave, '');
        return res.json({ imagen: '' });
    } finally {
        clearTimeout(timeout);
    }
});

// Consulta los registros de trayectoria de los jugadores.
app.get('/trayectoria', async function(req,res){
    // `id` aquí filtra por id_trayectoria; sin filtro se devuelven todos los pasos de carrera.
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Trayectoria WHERE id_trayectoria=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Trayectoria");
    }    
    res.send(respuesta);
})

// Devuelve los clubes registrados, con filtro opcional por identificador.
app.get('/equipos', async function(req,res){
    // `id` aquí corresponde a la clave primaria id_equipo.
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Equipos WHERE id_equipo=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Equipos");
    }    
    res.send(respuesta);
})

// Un solo fetch para Grid: devuelve jugadores, equipos y trayectorias en un objeto JSON.
app.get('/grid', async function(req, res) {
    try {
        const jugadores = await realizarQuery("SELECT id_jugador, nombre, apellido, pais FROM Jugadores");
        const equipos = await realizarQuery("SELECT id_equipo, nombre_equipo FROM Equipos");
        const trayectorias = await realizarQuery("SELECT id_jugador, id_equipo FROM Trayectoria");
        return res.json({ equipos, jugadores, trayectorias });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: 'Error fetching grid data' });
    }
});


// Pedidos POST

// Alta administrativa por HTTP, no por Socket.IO. Después del INSERT se emite un aviso en vivo
// a todos los sockets; cada cliente decide si escucha actualizacionJugadores.
app.post('/jugadores', async function(req,res) {
    console.log(req.body)
    let jugadorExistente = await realizarQuery(`SELECT apellido FROM Jugadores WHERE Jugadores.apellido="${req.body.apellido}"`);
    console.log(jugadorExistente)
    if (jugadorExistente.length > 0) {
        res.send("El jugador ya existe");
    } else {
        // Los valores del body se insertan en SQL con interpolación como en el código original.
        await realizarQuery(`
        INSERT INTO Jugadores (pais,posicion,liga_actual,dorsal_equipo,dorsal_seleccion,valor_mercado,nombre,apellido,id_equipo) VALUES
        ("${req.body.pais}","${req.body.posicion}","${req.body.liga_actual}",${req.body.dorsal_equipo},${req.body.dorsal_seleccion},${req.body.valor_mercado},"${req.body.nombre}","${req.body.apellido}",${req.body.id_equipo});
        `)
        
        // Ejemplo de WebSocket: Avisar al frontend que se agregó un jugador
        io.emit('actualizacionJugadores', { mensaje: 'Se agregó un nuevo jugador' }); // Broadcast a cualquier socket, no solo admin.
        
        res.send("Jugador agregado")
    }
})

// Alta de cuenta por HTTP. El cliente luego hace POST /login para obtener el perfil público
// y guardarlo localmente; esta ruta de registro no abre un socket ni inicia sesión por sí sola.
app.post('/usuarios', async function(req,res) {
    console.log(req.body)
    let usuarioExistente = await realizarQuery(`SELECT email FROM Usuarios WHERE Usuarios.email="${req.body.email}"`);
    console.log(usuarioExistente)
    if (usuarioExistente.length > 0) {
        res.send("El usuario ya existe");
    } else {
        // El esquema usa exactamente estas columnas: usuario, contraseña y email.
        await realizarQuery(`
        INSERT INTO Usuarios (usuario,contraseña,email) VALUES
        ("${req.body.name || req.body.nombre}","${req.body.password}","${req.body.email}");
        `)
        res.send("Usuario registrado")
    }
})

// Guarda los datos personales asociados a un jugador.
app.post('/datos', async function(req,res) {
    console.log(req.body)
    let datosExistentes = await realizarQuery(`SELECT id_jugador FROM Datos WHERE Datos.id_jugador=${req.body.id_jugador}`);
    console.log(datosExistentes)
    if (datosExistentes.length > 0) {
        res.send("Los datos ya existen");
    } else {
        await realizarQuery(`
        INSERT INTO Datos (edad,altura,peso,pierna_habil,id_jugador) VALUES
        (${req.body.edad},${req.body.altura},${req.body.peso},"${req.body.pierna_habil}",${req.body.id_jugador});
        `)
        res.send("Datos agregados")
    }
})

// Guarda las estadísticas de un jugador.
app.post('/estadisticas', async function(req,res) {
    console.log(req.body)
    let estadisticasExistentes = await realizarQuery(`SELECT id_jugador FROM Estadisticas WHERE Estadisticas.id_jugador="${req.body.id_jugador}"`);
    console.log(estadisticasExistentes)
    if (estadisticasExistentes.length > 0) {
        res.send("Las estadisticas ya existen");
    } else {
        await realizarQuery(`
        INSERT INTO Estadisticas (goles,asistencias,titulos_equipo,titulos_seleccion,titulos_individuales,id_jugador) VALUES
        (${req.body.goles},${req.body.asistencias},${req.body.titulos_equipo},${req.body.titulos_seleccion},${req.body.titulos_individuales},${req.body.id_jugador});
        `)
        res.send("Estadisticas agregadas")
    }
})

// Agrega un club y sus años a la trayectoria de un jugador.
app.post('/trayectoria', async function(req,res) {
    console.log(req.body)
    let trayectoriaExistente = await realizarQuery(`SELECT id_equipo FROM Trayectoria WHERE Trayectoria.id_equipo="${req.body.id_equipo}"`);
    console.log(trayectoriaExistente)
    if (trayectoriaExistente.length > 0) {
        res.send("La trayectoria ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Trayectoria (id_equipo,id_jugador,anio_traspaso,anio_ingreso) VALUES
        (${req.body.id_equipo},${req.body.id_jugador},${req.body.anio_traspaso},${req.body.anio_ingreso});
        `)
        res.send("Trayectoria agregada")
    }
})

// Registra un club si todavía no existe uno con ese nombre.
app.post('/equipos', async function(req,res) {
    console.log(req.body)
    let equipoExistente = await realizarQuery(`SELECT nombre_equipo FROM Equipos WHERE Equipos.nombre_equipo="${req.body.nombre_equipo}"`);
    console.log(equipoExistente)
    if (equipoExistente.length > 0) {
        res.send("El equipo ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Equipos (anio_creacion,titulos_nacionales,titulos_internacionales,ciudad,presidente,dt_actual,apodo,cantidad_socios,estadio,nombre_equipo) VALUES
        (${req.body.anio_creacion},${req.body.titulos_nacionales},${req.body.titulos_internacionales},"${req.body.ciudad}","${req.body.presidente}","${req.body.dt_actual}","${req.body.apodo}",${req.body.cantidad_socios},"${req.body.estadio}","${req.body.nombre_equipo}");
        `)
        
        // Broadcast global de notificación: { mensaje }. No es la sala del chat ni una sala de juego.
        io.emit('actualizacionEquipos', { mensaje: 'Se agregó un nuevo equipo' }); // Broadcast a cualquier socket, no solo admin.

        res.send("Equipo agregado")
    }
})

// El servidor HTTP recibe solicitudes Express y conexiones Socket.IO en el mismo puerto.
// Inicia Express y Socket.IO juntos. Con el puerto por defecto, ambos están en :4000.
server.listen(port, function(){
    console.log(`Server HTTP y WebSocket running in http://localhost:${port}`);
});
