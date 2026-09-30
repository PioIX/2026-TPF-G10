# Backend TP2 - Pio Socket (+ endpoints REST para repasar Fetch)

Backend base (Node.js + Express + Socket.IO) entregado por la cátedra para el
**Trabajo Práctico N°2** (Apunte 09 – Sockets), con endpoints REST agregados
para poder repasar también el apunte de **Fetch y Métodos de Array**.

## Eventos de Socket.IO (base del docente, sin modificar)

- `pingAll`: reenvía el mensaje recibido a **todos** los clientes conectados.
- `joinRoom`: une al socket a una sala (`room`), sacándolo antes de la sala anterior si tenía una.
- `sendMessage`: reenvía el mensaje a todos los clientes de la sala actual.
- `eventoPersonalizado`: incrementa un contador y responde con `respuestaPersonalizada` (contador por cliente).

## Endpoints REST (agregados para el repaso de Fetch)

- `GET /saludo` → `{ mensaje, timestamp }`
- `GET /estudiantes` → lista completa
- `POST /estudiantes` → body `{ nombre, edad, especialidad }`
- `PUT /estudiantes/:id` → body con los campos a actualizar
- `DELETE /estudiantes/:id`

Los datos viven en un array en memoria (`let estudiantes = [...]`), se
resetean cada vez que reiniciás el servidor. Es intencional, para que el
ejemplo de Fetch sea simple.

## Cómo iniciarlo

```bash
npm install
npm start      # producción: node index.js
npm run dev    # desarrollo: nodemon index.js
```

Corre en `http://localhost:4000` por defecto (`process.env.PORT`), con CORS
habilitado para `http://localhost:3000` y `http://localhost:3001` (los dos
puertos típicos del frontend Next.js).

## Generar el ejecutable para entregar a los alumnos

```bash
npm run build   # genera build/backend-tp2.exe (Windows, sin necesidad de Node.js)
```
