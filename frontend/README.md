# Proyecto de repaso — React + Next.js (DAI, 5to año)

Proyecto Next.js creado con las mismas opciones que indica el apunte de
"Creación de proyecto con NextJS" (JavaScript, ESLint, sin Tailwind, `src/`,
App Router, alias `@/*`). Cada ruta corresponde a un tema de los apuntes.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

Para que **/fetch** y **/socket** funcionen de verdad, además hay que
levantar el backend (ver `../backend/README.md`):

```bash
cd ../backend
npm install
npm run dev
```

## Estructura y qué cubre cada ruta

```
src/
├── app/
│   ├── layout.js            layout raíz + Navbar
│   ├── page.js               "/"               índice de temas
│   ├── teoria/                 "/teoria"         React, MVC, DOM Virtual, Next.js (conceptos)
│   ├── login/                    "/login"          componentes, props, componente compuesto
│   ├── home/                       "/home"           reutilización del mismo componente con otras props
│   ├── contador/                     "/contador"       useState + useEffect + estilos con clsx
│   ├── eventos/                        "/eventos"        objeto Event (event.target.value)
│   ├── condicional/                      "/condicional"    3 formas de conditional rendering
│   ├── fetch/                               "/fetch"          fetch GET/POST/PUT/DELETE + métodos de array
│   ├── router/                                 "/router"         useRouter (push/back/forward/replace/refresh)
│   │   └── destino/                               "/router/destino" useSearchParams
│   └── socket/                                       "/socket"         hook useSocket (WebSockets)
├── components/
│   ├── Navbar.js     barra lateral, resalta la ruta activa con clsx
│   ├── Title.js        componente simple (sin "use client")
│   ├── Button.js         componente con clsx condicional (verde/rojo/redondeado)
│   └── Form.js              componente COMPUESTO (usa Title + Button)
└── hooks/
    └── useSocket.js  hook de conexión a Socket.IO (tal como lo entregó la cátedra)
```

## Notas

- Todas las páginas que usan hooks o eventos empiezan con `"use client"`,
  siguiendo la regla del apunte de hooks.
- `Button.js` y `Navbar.js` usan `clsx` para activar/desactivar clases CSS
  según props o el estado de la ruta, como en el apunte de estilos.
- La IP/puerto del backend está hardcodeada como `http://localhost:4000` en
  `src/app/fetch/page.js` y como `ws://localhost:4000/` dentro de
  `src/hooks/useSocket.js`. Cambiarla ahí si el backend corre en otro lugar.
- El proyecto compila sin errores (`npm run build`) y pasa `npm run lint`
  limpio (el hook `useSocket.js` tiene dos comentarios `eslint-disable`
  porque así lo entregó la cátedra; funciona correctamente igual).
