# Kodigo Reservas

Plataforma de disponibilidad y reservas para barberías con varias sucursales:
- **Backend:** API REST con Fastify, TypeScript y PostgreSQL.
- **Frontend (`booking-portal/`):** Portal web de reservas multi-tenant con Next.js, flujo mobile-first de 3 pasos, autogestión sin cuenta mediante token y widget embebible con auto-redimensionamiento vía `postMessage`.

---

## Backend (API REST)

### Dependencias del proyecto

El proyecto usa Node.js 24 o posterior y npm para instalar las dependencias del proyecto en `node_modules`. El archivo `package-lock.json` fija las versiones que instala `npm ci`.

| Paquete | Para qué se usa |
|---|---|
| `fastify` | Servidor HTTP y rutas de la API. |
| `pg` | Conecta Node.js con un servidor PostgreSQL y administra el conjunto de conexiones. |
| `zod` | Valida parámetros y cuerpos de las solicitudes. |
| `stripe` | Integración de pagos online y verificación de webhooks. |
| `fastify-raw-body` | Captura el cuerpo en crudo (`Buffer`) para verificar firmas de Stripe. |
| `typescript` y `tsx` | Comprueban y compilan TypeScript, o ejecutan el código directamente durante desarrollo. |
| `eslint` y `typescript-eslint` | Revisan el código fuente y las pruebas. |
| `@types/node` y `@types/pg` | Proporcionan tipos para Node.js y su cliente PostgreSQL. |

### Preparar la base de datos local

#### 1. Instalar y arrancar PostgreSQL

Instala PostgreSQL 16 o posterior con el paquete o instalador de tu sistema. Asegúrate de tener el servidor y las herramientas de consola `psql` y `pg_isready`. Arranca el servicio de PostgreSQL con el mecanismo indicado por tu instalación y anota el puerto y el usuario administrador que configuraste. [Descargas oficiales de PostgreSQL](https://www.postgresql.org/download/).

En la **terminal del sistema**, ejecuta:

```text
psql --version
pg_isready -h 127.0.0.1 -p 5432
```

El primer comando confirma que el cliente está disponible. El segundo debe mostrar `accepting connections`, que indica que el servidor escucha en esa dirección. Si tu instalación usa otro puerto, reemplaza `5432` en los comandos y en `.env`.

#### 2. Crear el usuario y la base del proyecto

Omite la creación si ya tienes la base y un usuario con permisos para ejecutar las migraciones. Para una instalación nueva, en la **terminal del sistema**, conéctate a la base administrativa `postgres`. El ejemplo usa `postgres` como usuario administrador. Cámbialo si tu instalación usa otro rol.

```text
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres
```

`-U` selecciona el usuario y `-d` selecciona la base. Si el servidor pide contraseña, escribe la del administrador de PostgreSQL. Cuando veas un indicador como `postgres=#`, ya estás **dentro de `psql`**. Escribe solo los comandos, sin copiar ese indicador. [Manual de `psql`](https://www.postgresql.org/docs/16/app-psql.html).

Primero comprueba si ya existen el usuario y la base. Ejecuta cada línea con Enter.

```text
\du reservas
\l reservas
```

Si el rol falta, créalo. La sentencia SQL termina con punto y coma. Espera la respuesta `CREATE ROLE`.

```sql
CREATE ROLE reservas WITH LOGIN;
```

Para asignar la contraseña al rol recién creado, ejecuta la siguiente línea. Escribe la contraseña dos veces cuando se solicite. La consola oculta los caracteres.

```text
\password reservas
```

Si la base falta, créala con `reservas` como propietario para que el usuario pueda crear las tablas al migrar.

```sql
CREATE DATABASE reservas OWNER reservas;
```

Escribe `\q` para regresar a la terminal del sistema.

#### 3. Comprobar el acceso como usuario del proyecto

En la **terminal del sistema**, ejecuta:

```text
psql -h 127.0.0.1 -p 5432 -U reservas -d reservas -W
```

`-W` hace que el cliente te pida la contraseña que elegiste para `reservas`. El indicador `reservas=>` señala que entraste a la base. Ejecuta `\conninfo` para comprobar la base, el usuario, el host y el puerto. Después, escribe `\q` para salir y continuar con la configuración del proyecto.

#### 4. Configurar la conexión y aplicar las migraciones

En la **terminal del sistema**, abre la raíz del repositorio, donde está `package.json`. Comprueba que tienes Node.js 24 o posterior e instala las dependencias:

```text
node --version
npm ci
```

Desde tu editor, copia `.env.example` a un archivo llamado `.env` en la raíz del repositorio. Si ya tienes `.env`, conserva el archivo y actualiza la conexión.

```dotenv
DATABASE_URL=postgresql://reservas:CAMBIAR@127.0.0.1:5432/reservas
PORT=3000
HOST=127.0.0.1
```

Sustituye `CAMBIAR` por la contraseña de PostgreSQL. Si contiene caracteres reservados en una URL, codifícalos en `DATABASE_URL`. Por ejemplo, `@` se escribe como `%40`. En el aviso de `psql` se usa la contraseña original. En este ejemplo, `5432` es el puerto de PostgreSQL y `3000` es el puerto de la API. Mantén `.env` fuera de Git. [Formato de la URL de PostgreSQL](https://www.postgresql.org/docs/16/libpq-connect.html#LIBPQ-CONNSTRING).

Desde la raíz del repositorio, ejecuta:

```text
npm run migrate
```

Este comando aplica las migraciones pendientes a la base indicada en `DATABASE_URL`. PostgreSQL debe estar iniciado. El comando puede finalizar correctamente sin imprimir una lista de tablas.

#### 5. Verificar las tablas y cargar datos iniciales

Vuelve a conectarte a `reservas` con el comando del paso 3. **Dentro de `psql`**, ejecuta una línea a la vez:

```text
\conninfo
\dt public.*
\d public.appointments
```

Deberías ver tablas como `businesses`, `branches`, `appointments` y `schema_migrations`. Para comprobar qué migración se aplicó, ejecuta esta consulta **dentro de `psql`**:

```sql
SELECT name FROM public.schema_migrations ORDER BY name;
```

Las migraciones dejan listo el esquema. Para probar la API con datos, ejecuta una vez el [SQL de datos iniciales](docs/arquitectura.md#datos-iniciales) en la base `reservas`. Guarda los identificadores que devuelve para consultar la disponibilidad.

Si el indicador se queda en `postgres-#` o `reservas->`, hay una instrucción SQL pendiente. Pulsa **Ctrl+C** para descartarla. Los comandos de `psql` que empiezan por `\` se ejecutan con Enter y sin punto y coma. Si estás en la base `postgres`, puedes cambiar a `reservas` con `\c reservas` y volver a ejecutar `\conninfo` y `\dt public.*`.

### Ejecutar la API

Sal de `psql` con `\q`. Desde la raíz del repositorio, elige cómo iniciar la API.

**En desarrollo**, ejecuta:

```text
npm run dev
```

La API muestra la dirección en la que escucha, normalmente `http://127.0.0.1:3000`. La terminal queda ocupada mientras el servidor está en ejecución. Usa otra terminal para hacer consultas.

**Para probar la versión compilada**, pulsa **Ctrl+C** en la terminal donde ejecutaste `npm run dev`. Luego ejecuta:

```text
npm run build
npm start
```

`npm run dev` y `npm start` arrancan la misma API y usan el mismo puerto de forma predeterminada. Ejecuta uno a la vez. El [contrato de la API](docs/arquitectura.md#api) documenta las rutas y permisos.

#### Probar la disponibilidad en el navegador

Usa el `branch_id` y el `service_id` devueltos por el SQL de datos iniciales. Sustituye ambos marcadores en la URL y ajusta el puerto si lo cambiaste en `.env`.

```text
http://127.0.0.1:3000/negocios/mibarberia503/sucursales/ID_SUCURSAL/disponibilidad?date=2026-11-25&serviceId=ID_SERVICIO
```

`date` es el día que quieres consultar en la zona horaria de la sucursal (UTC−6). Usa el formato `AAAA-MM-DD`, con ceros iniciales cuando hagan falta. `2026-11-25` es un ejemplo de formato. Sustitúyelo por una fecha próxima de lunes a sábado. Si escribes `AAAA-MM-DD` literalmente, usas barras o incluyes una hora, la API devuelve `date: valor inválido`.

La respuesta contiene una lista `slots`. Si está vacía, la consulta fue válida y no hay horarios que se puedan reservar para ese día.

### Errores frecuentes (Backend)

| Mensaje o síntoma | Qué revisar |
|---|---|
| `EADDRINUSE: address already in use 127.0.0.1:3000` | El puerto de la API está ocupado. Si ya ejecutaste `npm run dev` o `npm start`, usa esa instancia o detenla con **Ctrl+C** en su terminal antes de iniciar otra. Si otro servicio necesita el puerto, configura `PORT=3001` en `.env` e inicia la API en `http://127.0.0.1:3001`. |
| La terminal indica que `psql` no existe | Instala las herramientas de consola de PostgreSQL. Si ya están instaladas, agrega su directorio de ejecutables a `PATH` y abre una terminal nueva. |
| `connection refused` o `no response` | Arranca el servicio de PostgreSQL y verifica el puerto con `pg_isready`. |
| `role "reservas" does not exist` | Revisa `\du reservas` desde la sesión del administrador y crea el rol antes de asignar su contraseña o crear la base. |
| `database "reservas" does not exist` | Revisa `\l reservas` y crea la base en la misma instancia a la que te conectas. |
| `password authentication failed` | Comprueba el usuario y su contraseña. Escribe la contraseña original en `psql` y la versión codificada si corresponde en `.env`. |
| `\dt` no muestra tablas | Ejecuta `\conninfo` y verifica que coincida con la conexión en `.env`. Si estás en `postgres`, usa `\c reservas`. Luego ejecuta `\dt public.*`. Si sigue vacío, revisa el resultado de `npm run migrate`. |

### Verificación del código (Backend)

Ejecuta `npm run lint`, `npm run typecheck` y `npm test` antes de solicitar revisión. Para ejecutar la integración con PostgreSQL, configura `TEST_DATABASE_URL` con una base de pruebas separada. El usuario de pruebas necesita permiso para crear esquemas. La suite crea y elimina su propio esquema.

---

## Frontend — Portal de Reservas Multi-tenant (`booking-portal/`)

Portal web de reservas de citas para salones de belleza y barberías con arquitectura multi-tenant, flujo mobile-first de 3 pasos, autogestión sin cuenta mediante token y widget embebible con auto-redimensionamiento vía `postMessage`.

### URLs de Acceso Rápido

> **Nota:** Para usar las URLs con la IP local (`192.168.0.155`), asegúrate de tener levantado el servidor de Next.js (puerto `3000`) y, para la página externa, el servidor estático (puerto `8080`).

| Vista / Recurso | URL Localhost | URL Red Local (`192.168.0.155`) |
| --- | --- | --- |
| **Portal completo (directo)** | `http://localhost:3000/barberia-studio-sv` | `http://192.168.0.155:3000/barberia-studio-sv` |
| **Widget aislado (`/embed/[slug]`)** | `http://localhost:3000/embed/barberia-studio-sv` | `http://192.168.0.155:3000/embed/barberia-studio-sv` |
| **Página externa con widget embebido** | `http://localhost:8080/reservas.html` | `http://192.168.0.155:8080/reservas.html` |
| **Gestión / cancelación de cita (`/booking/[token]`)** | `http://localhost:3000/booking/tok_test_01` | `http://192.168.0.155:3000/booking/tok_test_01` |
| **Historial de citas del navegador** | `http://localhost:3000/booking/history` | `http://192.168.0.155:3000/booking/history` |
| **Script cargador del widget (`widget.js`)** | `http://localhost:3000/widget.js` | `http://192.168.0.155:3000/widget.js` |

### Cómo Levantar el Frontend

#### 1. Frontend (`booking-portal`)

Requisitos previos: **Node.js 20+** y **pnpm 11+** (`pnpm@11.9.0`).

```bash
cd booking-portal
pnpm install
pnpm run dev
```

El script `dev` ejecuta `next dev -H 0.0.0.0`, exponiendo la aplicación en todas las interfaces de red en el puerto `3000` (con `allowedDevOrigins: ["*"]` y cabeceras CORS configuradas en `booking-portal/next.config.ts`).

#### 2. Sitio Externo de Prueba (`reservas.html`)

Para servir la página externa en un origen distinto (puerto `8080`):

```bash
python3 -m http.server 8080 --directory /home/capo/Documentos/GraficosPython
```

Luego abre en tu navegador: `http://192.168.0.155:8080/reservas.html`.

### Stack Tecnológico (Frontend)

- **Framework:** Next.js `16.4.6` (App Router + Turbopack)
- **Lenguaje:** TypeScript (`^5`, modo estricto)
- **Estilos y UI:** Tailwind CSS `4.3.3` (`@tailwindcss/turbopack`), `@base-ui/react`, `shadcn`, `lucide-react`
- **Estado del servidor y caché:** TanStack Query (`@tanstack/react-query` `^5.108.2`)
- **Validación de esquemas:** Zod (`^4.6.7`)
- **Fechas y zonas horarias:** `date-fns` (`^4.4.0`) + `date-fns-tz` (`^3.2.0`)
- **Notificaciones:** `sonner` (`^2.0.8`)

### Arquitectura General (Frontend)

```mermaid
flowchart TD
    Ext["Sitio externo (reservas.html :8080)"] -->|"Carga script"| WidgetJS["public/widget.js"]
    WidgetJS -->|"Crea iframe + escucha postMessage"| EmbedRoute["/embed/[slug]"]
    User["Usuario directo"] --> PortalRoute["/[slug]"]
    User --> ManageRoute["/booking/[token]"]
    User --> HistoryRoute["/booking/history"]

    PortalRoute --> Wizard["BookingWizard.tsx"]
    EmbedRoute --> Wizard
    EmbedRoute --> Bridge["EmbedIframeBridge.tsx (ResizeObserver -> postMessage)"]

    Wizard --> Step1["StepServiceStaff.tsx (Paso 1)"]
    Wizard --> Step2["StepDateTime.tsx (Paso 2)"]
    Wizard --> Step3["StepCustomerConfirm.tsx (Paso 3)"]
    Step3 --> Pay["PaymentSection.tsx"]
    Wizard --> Success["BookingSuccess.tsx"]

    Wizard --> Service["booking.service.ts"]
    ManageRoute --> MgmtView["BookingManagementView.tsx"] --> Service
    HistoryRoute --> HistView["BookingHistoryView.tsx"] --> Service

    Service -->|"NEXT_PUBLIC_USE_MOCKS=true"| Mock["salon.mock.ts + localStorage"]
    Service -->|"NEXT_PUBLIC_USE_MOCKS=false"| API["api-client.ts -> Backend REST"]
```

### Estructura del Proyecto (`booking-portal/`)

```text
booking-portal/
├── .env.local                         # Variables de entorno (modo mock / URL de API)
├── next.config.ts                     # allowedDevOrigins, Turbopack y cabeceras CORS
├── package.json                       # Scripts y dependencias (pnpm)
├── public/
│   └── widget.js                      # Cargador ligero del widget embebible
└── src/
    ├── app/
    │   ├── layout.tsx                 # Layout raíz, fuentes, QueryProvider y Toaster (Sonner)
    │   ├── globals.css                # Tema Tailwind v4 + variables CSS
    │   ├── page.tsx                   # Página raíz
    │   ├── (portal)/[slug]/           # Portal público completo del salón
    │   ├── (embed)/embed/[slug]/      # Vista aislada sin chrome para iframe
    │   └── booking/
    │       ├── [token]/               # Gestión y cancelación de cita sin cuenta
    │       └── history/               # Historial local de citas del usuario
    ├── components/
    │   ├── booking/
    │   │   ├── BookingWizard.tsx      # Orquestador del flujo de 3 pasos
    │   │   ├── StepServiceStaff.tsx   # Paso 1: selección múltiple de servicios y staff
    │   │   ├── StepDateTime.tsx       # Paso 2: calendario 14 días, timezone y horarios
    │   │   ├── StepCustomerConfirm.tsx# Paso 3: formulario Zod, resumen y pago
    │   │   ├── PaymentSection.tsx     # Sección unificada de pago (Local vs Tarjeta/Depósito)
    │   │   ├── BookingSuccess.tsx     # Confirmación y enlace a /booking/[token]
    │   │   ├── BookingManagementView.tsx # Detalle y cancelación de reserva por token
    │   │   └── BookingHistoryView.tsx # Listado de reservas guardadas localmente
    │   ├── embed/
    │   │   └── EmbedIframeBridge.tsx  # Emite BOOKING_WIDGET_RESIZE vía postMessage
    │   ├── layout/
    │   │   └── StickyFooter.tsx       # Barra inferior fija mobile-first
    │   ├── providers/
    │   │   └── query-provider.tsx     # Cliente de TanStack Query
    │   └── ui/                        # Componentes UI base (button, card, input, etc.)
    ├── lib/
    │   ├── api-client.ts              # Cliente fetch tipado con ApiError
    │   ├── timezone.ts                # Utilidades de formato y conversión con date-fns-tz
    │   └── utils.ts                   # Helper cn
    ├── services/
    │   ├── booking.service.ts         # Capa de servicios (mocks vs API real)
    │   └── mocks/salon.mock.ts        # Datos mock + persistencia en localStorage
    └── types/
        └── booking.contracts.ts       # Contratos TypeScript compartidos
```

### Estado del Plan de Trabajo por Fases

| Fase | Descripción | Estado |
| --- | --- | --- |
| **Fase 1** | Arquitectura Base y Contratos de Datos (Next.js App Router, TypeScript estricto, Tailwind, Zod, TanStack Query, rutas `/[slug]` y `/embed/[slug]`, capa `services/` con mocks) | Completada |
| **Fase 2** | Flujo Principal Mobile-First en 3 pasos (Single Page Flow, barra de progreso, `StickyFooter`, selección múltiple de servicios y staff, calendario de 14 días + selector de timezone, formulario mínimo + `PaymentSection.tsx` unificada) | Completada |
| **Fase 3** | Persistencia simulada en red local (`-H 0.0.0.0`, CORS en `next.config.ts`, `localStorage` para reservas y cancelaciones) | Completada |
| **Fase 4** | Autogestión sin cuenta (`/booking/[token]` e historial `/booking/history`) | Completada |
| **Fase 5** | Widget embebible (`public/widget.js` + `EmbedIframeBridge.tsx` con `postMessage`) y prueba en sitio externo (`reservas.html`) | Completada |

### Integración del Widget Embebible

El script `public/widget.js` permite incrustar el flujo de reservas en cualquier sitio web o CMS sin scroll doble gracias al puente `EmbedIframeBridge.tsx` (`ResizeObserver` + `postMessage` con tipo `BOOKING_WIDGET_RESIZE`).

#### Modo declarativo (HTML)

```html
<div
  data-booking-widget
  data-slug="barberia-studio-sv"
  data-base-url="http://192.168.0.155:3000"
></div>
<script src="http://192.168.0.155:3000/widget.js" async></script>
```

#### Modo programático (JavaScript)

```js
window.initBookingWidget({
  container: '#mi-contenedor',
  slug: 'barberia-studio-sv',
  baseUrl: 'http://192.168.0.155:3000',
});
```

Eventos emitidos hacia la ventana padre:
- `BOOKING_WIDGET_RESIZE`: ajusta dinámicamente el `height` del `<iframe>` según el contenido.
- `BOOKING_SUCCESS`: dispara el evento DOM `booking:success` en `window` cuando se confirma una reserva.

### Variables de Entorno y Datos Mock

Configuración actual en `booking-portal/.env.local`:

```env
# Cambiar a "false" cuando el backend esté desplegado
NEXT_PUBLIC_USE_MOCKS=true

# URL base del backend REST
NEXT_PUBLIC_API_URL=http://localhost:4000/api/public

# Espacio reservado para integración con Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
```

- **Salón de prueba (`slug`):** `barberia-studio-sv` (*Studio 503 Barber & Hair*, zona horaria `America/El_Salvador`, política de pago `DEPOSIT` del `25%`).
- **Persistencia simulada:** Las reservas creadas y cancelaciones se almacenan en `localStorage` bajo las claves `kodigo_bookings_store` y `kodigo_booking_tokens`, por lo que sobreviven a recargas (`F5`) y pueden consultarse en `/booking/[token]` o `/booking/history`.

### Contratos de Datos y Servicios

Definidos en `booking-portal/src/types/booking.contracts.ts` y consumidos por `booking-portal/src/services/booking.service.ts`:

- `getSalonProfile(slug)` → `SalonProfile`
- `getAvailableSlots({ slug, date, serviceId, staffId })` → `TimeSlot[]`
- `createBooking(payload: CreateBookingPayload)` → `CreateBookingResponse` (incluye `manageToken`, `additionalServiceIds` y `paymentMethod`: `'LOCAL' | 'CARD'`)
- `getBookingByToken(manageToken)` → `BookingDetails`
- `cancelBooking(payload: CancelBookingPayload)` → `CancelBookingResponse`
- `getBookingHistory(salonSlug?)` → `BookingDetails[]`

### Comandos Útiles (Frontend)

Ejecutar dentro de `booking-portal/`:

```bash
pnpm run dev               # Servidor de desarrollo en 0.0.0.0:3000
pnpm run build             # Compilación de producción
pnpm run start             # Servidor de producción
pnpm run lint              # Linter (ESLint)
pnpm exec tsc --noEmit     # Verificación de tipos TypeScript
```
