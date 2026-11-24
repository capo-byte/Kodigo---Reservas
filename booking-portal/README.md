This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Panel de negocio (rama `frontend-business`)

El panel administrativo está disponible en:

```text
/negocio/[slug]                 → Resumen y métricas del día
/negocio/[slug]/agenda          → Agenda diaria y semanal interactiva
/negocio/[slug]/servicios       → CRUD de servicios, tarifas y duraciones
/negocio/[slug]/personal        → CRUD de especialistas y días de trabajo
/negocio/[slug]/clientes        → Gestión e historial de clientes
/negocio/[slug]/configuracion   → Horarios, políticas y perfil del salón
```

Por ejemplo, con el salón de prueba: [`/negocio/barberia-studio-sv`](/negocio/barberia-studio-sv).

### Funcionalidad incluida

- Agenda visual con vistas **día** y **semana**, filtro por especialista y línea de hora actual.
- **Crear citas manuales** haciendo clic en un espacio libre o desde el botón «Nueva cita».
- **Reprogramar arrastrando** una cita a otro horario, día o columna de especialista.
- **Bloquear horarios** (almuerzos, reuniones, ausencias) y quitarlos desde la agenda.
- Acciones de cita: marcar **atendida**, **inasistencia**, **cancelar**, reprogramar o eliminar.
- CRUD de servicios con precio, duración, categoría y especialistas habilitados.
- CRUD de personal con datos de contacto, color de agenda, días de trabajo y activación.
- Gestión de clientes con búsqueda, filtros, historial, notas internas y próxima cita.
- Configuración de horario de atención, intervalo de slots, política de pago y política de cancelación.

### Datos y futura integración con la API

Toda la capa de datos del panel vive en `src/services/business.service.ts` y sus tipos en
`src/types/booking.contracts.ts`. Actualmente usa datos mock deterministas
(`src/services/mocks/business.mock.ts`), incluyendo citas relativas a la fecha actual. Para
conectar la API real basta con reemplazar las implementaciones de `businessService` por
llamadas a `apiClient`, manteniendo las firmas y los tipos de `BusinessSnapshot`.

> El panel de negocio funciona sin variables de entorno. El portal público existente usa
> `bookingService`; para probarlo con mocks crea un `.env.local` con
> `NEXT_PUBLIC_USE_MOCKS=true`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
