/*
 * ============================================================
 *  BASE ORIGINAL DEL DOCENTE (TP2 - Pio Socket)
 *  No se modificó la lógica de Socket.IO que entregaron.
 * ============================================================
 */
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { Server } = require("socket.io");

// Express maneja HTTP; Socket.IO agrega eventos en tiempo real al mismo servidor.
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
// Permite leer req.body cuando el frontend manda JSON con POST o PUT.
app.use(express.json());

const sessionMiddleware = session({
  secret: "supersarasa",
  resave: false,
  saveUninitialized: false,
});
app.use(sessionMiddleware);

/*
 * ============================================================
 *  AGREGADO PARA REPASAR "FETCH EN NEXTJS Y MÉTODOS DE ARRAY"
 *  (mismo estilo que el apunte: GET /saludo y CRUD /estudiantes)
 * ============================================================
 */

const server = app.listen(PORT, () => {
  console.log(`Servidor NodeJS corriendo en http://localhost:${PORT}/`);
});

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

let contador = 0;

// "connection" ocurre automáticamente al conectarse un navegador.
io.on("connection", (socket) => {
  const req = socket.request;

  // socket.on escucha un evento que emite el FRONTEND.
  socket.on("joinRoom", (data) => {
    if (req.session.room != undefined && req.session.room.length > 0) {
      socket.leave(req.session.room);
    }
    req.session.room = data.room;
    socket.join(req.session.room);

    // io.to(room).emit manda el evento solamente a esa sala.
    io.to(req.session.room).emit("chat-messages", {
      user: req.session.user || "alguien",
      room: req.session.room,
    });
  });

  socket.on("pingAll", (data) => {
    console.log("PING ALL:", data);
    // io.emit manda a TODOS los clientes conectados.
    io.emit("pingAll", { event: "Ping to all", message: data });
  });

  socket.on("sendMessage", (data) => {
    // Este mensaje llega solo a quienes estén en la misma sala.
    io.to(req.session.room).emit("newMessage", {
      room: req.session.room,
      message: data.message,
    });
  });

  socket.on("eventoPersonalizado", () => {
    contador++;
    socket.emit("respuestaPersonalizada", { contador });
  });

  socket.on("disconnect", () => {
    console.log("Disconnect");
  });
});
