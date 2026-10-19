# Integración de Socket.IO

Este documento describe la conexión en tiempo real entre Next.js y Express, las salas de los minijuegos y el chat global.

## Decisiones de funcionamiento

- La persona elige primero un minijuego y después decide si juega sola, crea una sala o ingresa un código.
- El primer alcance es de dos personas por sala.
- Cada participante recibe su propio desafío aleatorio. La sala comparte el avance público, no las respuestas secretas.
- El chat global aparece en el menú y el backend solo permite usarlo con una sesión iniciada.
- Las partidas individuales no crean salas ni envían progreso.

## Componentes del frontend

### `SocketProvider`

Está montado en el layout raíz y mantiene una única conexión Socket.IO durante la navegación. Incluye `withCredentials` para enviar la cookie de sesión al backend, que usa el puerto 4000.

### Conexión compartida

`SocketProvider` exporta un `useSocket` propio basado en Context. El lobby, el chat y el login usan esa conexión compartida, que persiste al navegar entre páginas.

El archivo preexistente `frontend/src/hooks/useSocket.js` se conserva sin cambios y Admin sigue usándolo con su conexión independiente. No forma parte del socket compartido de los minijuegos.

### `GameLobby`

Es la entrada reutilizable para Wordle, Adivina el jugador, Fútbol 11 y Grid. Crea salas, muestra el código, permite ingresar a otra sala y monta el juego solo cuando se eligió el modo o llegó el segundo participante.

Dentro del juego, `useGameSession` da acceso al modo actual, a la sala, al progreso del rival y a la función para publicar el avance.

### `OpponentProgress`

Muestra el resumen y el estado visual público del rival mientras juega. Cuando la partida local termina, el panel ocupa casi toda la pantalla y permite volver a la partida propia. En Wordle dibuja las filas probadas, en Adivina el jugador muestra las preguntas sin revelar el objetivo, en Fútbol 11 muestra la formación y en Grid dibuja las celdas ya resueltas.

### `GlobalChat`

Se muestra en el menú. Al conectarse, pide acceso al chat, carga el historial reciente y escucha mensajes nuevos. El backend valida la sesión y el contenido del mensaje.

## Eventos de Socket.IO

| Evento | Dirección | Uso |
| --- | --- | --- |
| `createRoom` | Cliente → servidor | Crea una sala para un juego elegido; responde con un código de seis caracteres. |
| `joinRoom` | Cliente → servidor | Ingresa a una sala con código y comprueba que sea del juego correcto y tenga lugar. |
| `roomUpdated` | Servidor → sala | Actualiza participantes y estado de espera. |
| `roomMatched` | Servidor → sala | Indica que se unió el segundo jugador y que pueden comenzar sus partidas independientes. |
| `leaveRoom` | Cliente → servidor | Sale de la sala y libera el lugar. |
| `roomPlayerLeft` | Servidor → sala | Avisa que un participante salió o perdió la conexión. |
| `roomClosed` | Servidor → sala | Avisa que una sala se cerró. |
| `sendProgress` | Cliente → servidor | Envía métricas públicas del minijuego actual. |
| `opponentProgress` | Servidor → rival | Reenvía al otro participante el progreso validado. |
| `joinGlobalChat` | Cliente → servidor | Solicita entrar al chat global con una sesión iniciada. |
| `leaveGlobalChat` | Cliente → servidor | Sale del chat cuando la persona deja el menú. |
| `chat-messages` | Servidor → cliente | Entrega el historial reciente del chat. |
| `sendMessage` | Cliente → servidor | Envía un mensaje al chat global. |
| `newMessage` | Servidor → chat global | Publica un mensaje nuevo a los usuarios conectados al chat. |
| `pingAll` | Ambos sentidos | Evento de ejemplo conservado para seguir el material de clase. |

## Datos de progreso por juego

Los componentes publican solo datos que el rival puede ver:

- **Wordle:** `intentosUsados` (0–6), `terminado`, `gano` y el tablero de letras probadas con sus colores.
- **Adivina el jugador:** `preguntasUsadas` (0–10), `terminado`, `adivino`, el historial visible de respuestas y si se usó una pista. Se filtra la línea que contiene el nombre secreto.
- **Fútbol 11:** `jugadoresColocados` (0–11), `terminado`, los jugadores colocados y el país visible de la ronda.
- **Grid:** `celdasCompletadas` (0–9), `terminado`, filas, columnas y celdas resueltas. `puntaje` es opcional; por ahora equivale a las celdas acertadas.

El juego nunca envía al rival la palabra o el jugador secreto. Cada minijuego genera su estado aleatorio cuando se monta tras elegir el modo o completar la sala. El rival recibe una copia de lectura de los elementos que ya son visibles en la pantalla de quien juega.

## Sesión y login

El registro existente guarda la cuenta en MySQL mediante `POST /usuarios`. Al iniciar sesión, `POST /login` busca esa cuenta y verifica la contraseña en el backend; guarda id, nombre y correo en `req.session.user`.

Después del login, el frontend hace `GET /usuarios?id=...` para cargar desde MySQL el perfil público de la cuenta autenticada. La ruta valida que el id solicitado sea el de la sesión y nunca devuelve contraseñas. El frontend guarda el id y el nombre en `localStorage` como copia para la interfaz.

El middleware `express-session` se comparte con Socket.IO mediante `io.use`. Tras el login, el frontend reconecta el socket compartido para que el handshake envíe la cookie de sesión. Los eventos del socket leen la identidad de la sesión; no hacen un GET por cada mensaje o avance.

El módulo `backend/modulos/mysql.js` permanece sin cambios.

## Estado y límites de esta etapa

- Las salas, el código y los últimos 50 mensajes viven en memoria. Se pierden al reiniciar el backend.
- La vista rival se arma con los estados visuales públicos que cada minijuego publica; no permite interactuar con la partida del otro.
- El esquema actual permite asociar usuarios y puntajes con `UsuariosXPartida`. `Partida` todavía no registra el juego ni el código de sala.
- El backend valida el rango y el formato de los avances antes de reenviarlos.
- Para uso local, el backend acepta los puertos 3000 y 3001 de Next.js.

## Recorrido manual previsto

1. Iniciar backend y frontend.
2. Iniciar sesión con dos navegadores o perfiles independientes.
3. Elegir el mismo juego; una persona crea una sala y comparte el código.
4. La otra persona ingresa el código. Ambos deben ver sus propios desafíos y la sala debe indicar dos participantes.
5. Avanzar en cada juego y observar el contador rival.
6. Terminar una partida y comprobar que el panel de progreso se amplíe.
7. Volver al menú e intercambiar mensajes desde el chat global.
