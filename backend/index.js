// backend/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const http = require('http'); // Necesario para Socket.IO
const crypto = require('node:crypto');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io'); // Importamos Socket.IO
const { realizarQuery } = require('./modulos/mysql');

const app = express();
const port = process.env.PORT || 4000;

// Creamos el servidor HTTP envolviendo la app de Express
const server = http.createServer(app);

// Permite que los dos puertos de Next.js se conecten y envíen la cookie de sesión.
const opcionesCors = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

// Comparte la configuración de sesión entre Express y Socket.IO.
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'supersarasa',
  resave: false,
  saveUninitialized: false
});

// Inicializa Socket.IO con las mismas reglas de origen que el backend HTTP.
const io = new Server(server, {
  cors: opcionesCors
});

// Middleware de Express
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors(opcionesCors));
app.use(sessionMiddleware);

// Carga en cada socket la sesión que ya abrió Express para ese navegador.
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});


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

// Crea un código corto y evita letras o números que se confunden al leerlos.
function generarCodigoSala() {
    let codigo;
    do {
        codigo = Array.from({ length: 6 }, () => (
            alfabetoCodigos[crypto.randomInt(alfabetoCodigos.length)]
        )).join('');
    } while (salas.has(codigo));

    return codigo;
}

// Devuelve solo los datos que los dos participantes necesitan compartir.
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

// Actualiza la pantalla de espera de cada conexión unida a la sala.
function emitirEstadoSala(sala) {
    io.to(sala.codigo).emit('roomUpdated', obtenerEstadoSala(sala));
}

// Retira la conexión de su sala actual y actualiza la sesión de Express.
function retirarDeSala(socket, motivo, limpiarSesion = true) {
    const req = socket.request;
    const codigo = req.session?.room;
    const sala = codigo ? salas.get(codigo) : null;
    if (!sala) {
        if (limpiarSesion && req.session) {
            delete req.session.room;
            req.session.save(() => {});
        }
        return;
    }

    const indice = sala.jugadores.findIndex((jugador) => jugador.socketId === socket.id);
    const jugador = indice === -1 ? null : sala.jugadores.splice(indice, 1)[0];
    socket.leave(sala.codigo);

    if (sala.jugadores.length === 0) {
        salas.delete(sala.codigo);
        io.to(sala.codigo).emit('roomClosed', { room: sala.codigo });
    } else if (jugador) {
        sala.estado = 'esperando';
        sala.jugadores[0].posicion = 1;
        sala.jugadores[0].anfitrion = true;
        io.to(sala.codigo).emit('roomPlayerLeft', {
            position: jugador.posicion,
            reason: motivo
        });
        emitirEstadoSala(sala);
    }

    if (limpiarSesion && req.session) {
        delete req.session.room;
        req.session.save(() => {});
    }
}

// Acepta métricas públicas y descarta respuestas que revelarían la solución.
function limpiarProgreso(juego, progreso) {
    if (!progreso || typeof progreso !== 'object' || Array.isArray(progreso)) return null;

    const estaEnRango = (valor, minimo, maximo) => (
        Number.isInteger(valor) && valor >= minimo && valor <= maximo
    );

    if (juego === 'wordle' && estaEnRango(progreso.intentosUsados, 0, 6) && typeof progreso.terminado === 'boolean') {
        const limpio = {
            intentosUsados: progreso.intentosUsados,
            terminado: progreso.terminado,
            gano: progreso.terminado ? Boolean(progreso.gano) : false
        };

        // El tablero contiene solo letras probadas y colores; nunca se envía la palabra secreta.
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

    if (juego === 'adivinaeljugador' && estaEnRango(progreso.preguntasUsadas, 0, 10) && typeof progreso.terminado === 'boolean') {
        const limpio = {
            preguntasUsadas: progreso.preguntasUsadas,
            terminado: progreso.terminado,
            adivino: progreso.terminado ? Boolean(progreso.adivino) : false
        };

        // El historial es visible para el rival, pero se excluye la línea que contiene al jugador secreto.
        if (Array.isArray(progreso.respuestas)) {
            limpio.respuestas = progreso.respuestas
                .filter((respuesta) => typeof respuesta === 'string' && !respuesta.startsWith('✅ ACIERTO:'))
                .slice(0, 10)
                .map((respuesta) => respuesta.slice(0, 180));
        }
        if (typeof progreso.pistaActiva === 'boolean') limpio.pistaActiva = progreso.pistaActiva;
        return limpio;
    }

    if (juego === 'futbol11' && estaEnRango(progreso.jugadoresColocados, 0, 11) && typeof progreso.terminado === 'boolean') {
        const limpio = {
            jugadoresColocados: progreso.jugadoresColocados,
            terminado: progreso.terminado
        };

        // La formación y el país actual son datos que el jugador ya ve en su propia pantalla.
        if (Array.isArray(progreso.formacion) && progreso.formacion.length === 11) {
            limpio.formacion = progreso.formacion.map((nombre) => (
                typeof nombre === 'string' ? nombre.slice(0, 64) : ''
            ));
        }
        if (typeof progreso.paisActual === 'string') limpio.paisActual = progreso.paisActual.slice(0, 64);
        return limpio;
    }

    if (juego === 'grid' && estaEnRango(progreso.celdasCompletadas, 0, 9)) {
        const puntajeValido = progreso.puntaje === undefined || estaEnRango(progreso.puntaje, 0, 100);
        if (!puntajeValido || typeof progreso.terminado !== 'boolean') return null;

        const limpio = {
            celdasCompletadas: progreso.celdasCompletadas,
            puntaje: progreso.puntaje,
            terminado: progreso.terminado
        };

        // Encabezados y celdas completas reproducen la parte pública del tablero Grid.
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

io.on('connection', (socket) => {
  const req = socket.request;
  console.log(`Nuevo cliente conectado vía WebSocket: ${socket.id}`);

  // Conserva el evento de prueba que explica el envío de mensajes a todos los sockets.
  socket.on('pingAll', (data) => {
      io.emit('pingAll', { event: 'Ping to all', message: data });
  });

  // Crea una sala para el minijuego y guarda su código en la sesión.
  socket.on('createRoom', (data = {}, confirmar = () => {}) => {
      if (!juegosDisponibles.has(data.game)) {
          return confirmar({ ok: false, error: 'Ese juego no está disponible.' });
      }

      if (req.session.room) retirarDeSala(socket, 'cambio de sala', false);

      const codigo = generarCodigoSala();
      const usuario = req.session.user || {};
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
      req.session.room = codigo;
      socket.join(req.session.room);
      req.session.save((error) => {
          if (error) {
              retirarDeSala(socket, 'error de sesión');
              return confirmar({ ok: false, error: 'No se pudo guardar la sala en la sesión.' });
          }

          emitirEstadoSala(sala);
          return confirmar({ ok: true, room: obtenerEstadoSala(sala) });
      });
  });

  // Sigue el patrón joinRoom del apunte: sale de la sala anterior y entra a la indicada.
  socket.on('joinRoom', (data = {}, confirmar = () => {}) => {
      const codigo = String(data.room || '').trim().toUpperCase();
      const sala = salas.get(codigo);

      if (!sala) {
          return confirmar({ ok: false, error: 'No encontramos una sala con ese código.' });
      }
      if (data.game && data.game !== sala.juego) {
          return confirmar({ ok: false, error: 'El código pertenece a otro juego.' });
      }
      if (sala.jugadores.length >= maximoJugadoresPorSala || sala.estado === 'jugando') {
          return confirmar({ ok: false, error: 'La sala ya está completa.' });
      }

      if (req.session.room) retirarDeSala(socket, 'cambio de sala', false);

      const usuario = req.session.user || {};
      sala.jugadores.push({
          posicion: 2,
          socketId: socket.id,
          nombre: String(usuario.name || usuario.nombre || data.name || 'Jugador').trim().slice(0, 32),
          anfitrion: false
      });
      sala.estado = 'jugando';
      req.session.room = codigo;
      socket.join(req.session.room);
      req.session.save((error) => {
          if (error) {
              retirarDeSala(socket, 'error de sesión');
              return confirmar({ ok: false, error: 'No se pudo guardar la sala en la sesión.' });
          }

          emitirEstadoSala(sala);
          io.to(req.session.room).emit('roomMatched', obtenerEstadoSala(sala));
          return confirmar({ ok: true, room: obtenerEstadoSala(sala) });
      });
  });

  // Sale de la sala actual y deja su lugar disponible.
  socket.on('leaveRoom', (confirmar = () => {}) => {
      const room = req.session.room || null;
      retirarDeSala(socket, 'salida');
      return confirmar({ ok: true, room });
  });

  // Reenvía al rival las métricas públicas del juego, no las respuestas secretas.
  socket.on('sendProgress', (data = {}, confirmar = () => {}) => {
      const sala = salas.get(req.session.room);
      if (!sala || sala.estado !== 'jugando') {
          return confirmar({ ok: false, error: 'No hay una partida en curso.' });
      }

      const progreso = limpiarProgreso(sala.juego, data.progress);
      if (!progreso) {
          return confirmar({ ok: false, error: 'El progreso enviado no es válido.' });
      }

      const jugador = sala.jugadores.find((integrante) => integrante.socketId === socket.id);
      if (!jugador) {
          return confirmar({ ok: false, error: 'No formas parte de esta sala.' });
      }

      socket.to(req.session.room).emit('opponentProgress', {
          position: jugador.posicion,
          name: jugador.nombre,
          progress: progreso,
          updatedAt: Date.now()
      });
      return confirmar({ ok: true });
  });

  // Une al chat global solo a sesiones con usuario y entrega los mensajes recientes.
  socket.on('joinGlobalChat', (confirmar = () => {}) => {
      if (!req.session.user) {
          return confirmar({ ok: false, error: 'Iniciá sesión para usar el chat.' });
      }

      socket.join(salaChatGlobal);
      socket.emit('chat-messages', {
          user: req.session.user,
          room: salaChatGlobal,
          messages: historialChat
      });
      return confirmar({ ok: true });
  });

  // Saca esta conexión del chat cuando la persona deja el menú.
  socket.on('leaveGlobalChat', (confirmar = () => {}) => {
      socket.leave(salaChatGlobal);
      return confirmar({ ok: true });
  });

  // Envía mensajes a los miembros autenticados del chat global.
  socket.on('sendMessage', (data = {}, confirmar = () => {}) => {
      const texto = typeof data.message === 'string' ? data.message.trim() : '';
      const ahora = Date.now();

      if (!req.session.user || !socket.rooms.has(salaChatGlobal)) {
          return confirmar({ ok: false, error: 'Unite al chat con una sesión iniciada.' });
      }
      if (!texto || texto.length > 500) {
          return confirmar({ ok: false, error: 'El mensaje debe tener entre 1 y 500 caracteres.' });
      }
      if (ahora - (ultimoMensajeChat.get(socket.id) || 0) < 500) {
          return confirmar({ ok: false, error: 'Esperá un momento antes de enviar otro mensaje.' });
      }

      ultimoMensajeChat.set(socket.id, ahora);
      const mensaje = {
          id: crypto.randomUUID(),
          user: req.session.user,
          message: texto,
          createdAt: new Date(ahora).toISOString()
      };
      historialChat.push(mensaje);
      if (historialChat.length > 50) historialChat.shift();

      io.to(salaChatGlobal).emit('newMessage', {
          room: salaChatGlobal,
          message: mensaje
      });
      return confirmar({ ok: true, message: mensaje });
  });

  // Libera la sala de juego cuando la conexión se cierra.
  socket.on('disconnect', () => {
      ultimoMensajeChat.delete(socket.id);
      retirarDeSala(socket, 'desconexión');
      console.log('Disconnect');
  });
});
// ------------------------------------


// --- RUTAS HTTP (FETCH) ---

app.get('/', function(req, res){
    res.status(200).send({
        message: 'Backend Funcionando - Listo para Next.js!'
    });
});

// Comprueba las credenciales y guarda una identidad mínima para HTTP y Socket.IO.
app.post('/login', async function(req, res) {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (!email || !password) {
        return res.status(400).json({ ok: false, error: 'Completá el correo y la contraseña.' });
    }

    try {
        // mysql.format escapa los valores antes de pasarlos al helper existente.
        const usuarios = await realizarQuery(mysql.format(
            'SELECT id_usuarios, name, email, password FROM Usuarios WHERE email = ? LIMIT 1',
            [email]
        ));
        const usuario = Array.isArray(usuarios) ? usuarios[0] : null;

        if (!usuario) {
            return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.' });
        }

        // Permite validar las cuentas antiguas en texto plano y hashes bcrypt existentes.
        const contrasenaGuardada = String(usuario.password || '');
        const usaBcrypt = /^\$2[aby]\$/.test(contrasenaGuardada);
        const credencialesValidas = usaBcrypt
            ? await bcrypt.compare(password, contrasenaGuardada)
            : password === contrasenaGuardada;

        if (!credencialesValidas) {
            return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.' });
        }

        // Regenera el identificador para iniciar una sesión nueva tras autenticarse.
        req.session.regenerate((error) => {
            if (error) {
                return res.status(500).json({ ok: false, error: 'No se pudo iniciar la sesión.' });
            }

            req.session.user = {
                id: usuario.id_usuarios,
                name: usuario.name,
                email: usuario.email
            };

            req.session.save((errorGuardar) => {
                if (errorGuardar) {
                    return res.status(500).json({ ok: false, error: 'No se pudo guardar la sesión.' });
                }

                return res.json({
                    ok: true,
                    user: {
                        id: usuario.id_usuarios,
                        name: usuario.name,
                        email: usuario.email
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return res.status(500).json({ ok: false, error: 'No se pudo iniciar la sesión.' });
    }
});

// Pedidos GET
app.get('/usuarios', async function(req,res){
    // El GET solo entrega el perfil de la sesión actual; nunca devuelve contraseñas ni otros usuarios.
    if (!req.session.user) {
        return res.status(401).json({ error: 'Iniciá sesión para consultar tus datos.' });
    }

    const idSesion = String(req.session.user.id);
    const idSolicitado = req.query.id === undefined ? idSesion : String(req.query.id);
    if (idSolicitado !== idSesion) {
        return res.status(403).json({ error: 'Solo podés consultar los datos de tu propia cuenta.' });
    }

    try {
        // Se consulta MySQL por el id validado contra la sesión y se devuelven solo campos públicos.
        const usuarios = await realizarQuery(mysql.format(
            'SELECT id_usuarios, name, email FROM Usuarios WHERE id_usuarios = ? LIMIT 1',
            [idSesion]
        ));
        if (!Array.isArray(usuarios) || usuarios.length === 0) {
            return res.status(404).json({ error: 'No encontramos tu cuenta.' });
        }

        return res.json(usuarios);
    } catch (error) {
        console.error('Error al consultar el usuario:', error);
        return res.status(500).json({ error: 'No se pudieron consultar los datos de la cuenta.' });
    }
})

app.get('/datos', async function(req,res){
    // Nota: Tenías dos rutas '/datos'. Dejé esta que parece ser la "completa" con INNER JOIN
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Datos INNER JOIN Estadisticas on Estadisticas.id_jugador = Datos.id_jugador INNER JOIN Jugadores on Jugadores.id_jugador = Datos.id_jugador INNER JOIN Trayectoria on Trayectoria.id_jugador = Jugadores.id_jugador INNER JOIN Equipos on Equipos.id_equipo = Trayectoria.id_equipo WHERE Jugadores.id_jugador=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Datos INNER JOIN Estadisticas on Estadisticas.id_jugador = Datos.id_jugador INNER JOIN Jugadores on Jugadores.id_jugador = Datos.id_jugador INNER JOIN Trayectoria on Trayectoria.id_jugador = Jugadores.id_jugador INNER JOIN Equipos on Equipos.id_equipo = Trayectoria.id_equipo");
    }    
    res.send(respuesta);
})

app.get('/estadisticas', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Estadisticas WHERE id_estadisticas=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Estadisticas");
    }    
    res.send(respuesta);
})

app.get('/jugadores', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT Jugadores.id_jugador, Jugadores.nombre, Jugadores.apellido, Jugadores.pais, Jugadores.posicion, Datos.edad, Datos.altura, Equipos.nombre_equipo, Trayectoria.anio_ingreso, Trayectoria.anio_traspaso FROM Jugadores LEFT JOIN Datos ON Datos.id_jugador = Jugadores.id_jugador LEFT JOIN Trayectoria ON Trayectoria.id_jugador = Jugadores.id_jugador LEFT JOIN Equipos ON Equipos.id_equipo = Trayectoria.id_equipo WHERE Jugadores.id_jugador=${req.query.id}`);
    } else {
        respuesta = await realizarQuery("SELECT Jugadores.id_jugador, Jugadores.nombre, Jugadores.apellido, Jugadores.pais, Jugadores.posicion, Datos.edad, Datos.altura, Equipos.nombre_equipo, Trayectoria.anio_ingreso, Trayectoria.anio_traspaso FROM Jugadores LEFT JOIN Datos ON Datos.id_jugador = Jugadores.id_jugador LEFT JOIN Trayectoria ON Trayectoria.id_jugador = Jugadores.id_jugador LEFT JOIN Equipos ON Equipos.id_equipo = Trayectoria.id_equipo");
    }    
    res.send(respuesta);
})

app.get('/trayectoria', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Trayectoria WHERE id_trayectoria=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Trayectoria");
    }    
    res.send(respuesta);
})

app.get('/equipos', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Equipos WHERE id_equipos=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Equipos");
    }    
    res.send(respuesta);
})

// Endpoint para generar la grilla 3x3 con filas/columnas aleatorias
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

app.post('/jugadores', async function(req,res) {
    console.log(req.body)
    let jugadorExistente = await realizarQuery(`SELECT apellido FROM Jugadores WHERE Jugadores.apellido="${req.body.apellido}"`);
    console.log(jugadorExistente)
    if (jugadorExistente.length > 0) {
        res.send("El jugador ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Jugadores (pais,posicion,dorsal_equipo,dorsal_seleccion,valor_mercado,nombre,apellido,id_equipo) VALUES
        ("${req.body.pais}","${req.body.poisicion}",${req.body.dorsal_equipo},${req.body.dorsal_seleccion},${req.body.valor_mercado},"${req.body.nombre}","${req.body.apellido}",${req.body.id_equipo});
        `)
        
        // Ejemplo de WebSocket: Avisar al frontend que se agregó un jugador
        io.emit('actualizacionJugadores', { mensaje: 'Se agregó un nuevo jugador' });
        
        res.send("Jugador agregado")
    }
})

app.post('/usuarios', async function(req,res) {
    console.log(req.body)
    let usuarioExistente = await realizarQuery(`SELECT email FROM Usuarios WHERE Usuarios.email="${req.body.email}"`);
    console.log(usuarioExistente)
    if (usuarioExistente.length > 0) {
        res.send("El usuario ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Usuarios (name,password,email) VALUES
        ("${req.body.nombre}","${req.body.password}","${req.body.email}");
        `)
        res.send("Usuario registrado")
    }
})

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
        
        // Ejemplo WebSocket
        io.emit('actualizacionEquipos', { mensaje: 'Se agregó un nuevo equipo' });

        res.send("Equipo agregado")
    }
})

// IMPORTANTE: Ahora usamos server.listen en lugar de app.listen para que funcionen los WebSockets
server.listen(port, function(){
    console.log(`Server HTTP y WebSocket running in http://localhost:${port}`);
});
