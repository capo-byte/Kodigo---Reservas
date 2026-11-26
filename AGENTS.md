Aplicación de reservas para una barbería con varias sucursales.
Cada cita reserva un servicio para un cliente, sin asignar especialistas, salas, equipos ni otros recursos. No hay servicios grupales.
La base de datos es PostgreSQL. El backend usa Node.js y TypeScript. El equipo elige NestJS o Fastify. Usa el que ya esté en el repositorio, que actualmente es Fastify.
El frontend usa Next.js, React y TypeScript, con Tailwind CSS y shadcn/ui.

## Convenciones de código

- Valida en el backend los campos obligatorios de la cita — nombre y apellido del cliente, tipo de servicio, fecha y hora.
- Aplica el horario de sucursal de 8:00 a 16:00 y el laboral de 8:00 a 17:00. Ante conflicto prevalece el horario laboral. Cierra los domingos y aplica el horario habitual en feriados.
- Ofrece inicios cada 30 minutos. Reserva 20 minutos para la cita y 10 minutos entre citas para limpieza y preparación. Acepta reservas con anticipación mínima de 1 hora y máxima de 1 mes.
- Aplica UTC−6 para las sucursales en el backend y en la persistencia de horarios. Muestra al cliente las horas en formato de 24 horas.
- Modela el flujo `Pendiente → Confirmada → Completada`, con posibles salidas a `Cancelada`, `Expirada` e `Inasistencia`. Mantén separado el estado del pago.
- Confirma automáticamente al enviar el formulario y ocupa el espacio en ese momento. Aplica una retención temporal de 15 minutos según el flujo documentado. Si el pago llega después del vencimiento, no apliques la reserva.
- Permite que cualquier usuario reprograme una vez, hasta un máximo de dos días después. Conserva las horas de citas existentes cuando cambie la configuración. El plazo de cancelación está pendiente de definir. No lo supongas. Permite que cualquier usuario registre una inasistencia y libera el espacio para otra cita.
- Admite pagos antes de confirmar o en el negocio, sin anticipo. La sucursal o la plataforma puede recibir el dinero. Resuelve manualmente en efectivo los pagos fallidos o pendientes. Revisa manualmente las confirmaciones duplicadas o tardías y devuelve el dinero si hubo un cobro duplicado.

## Git

- Sigue las convenciones del repositorio. Si aún no existen, usa ramas `feat/<descripcion>`, `fix/<descripcion>` o `docs/<descripcion>` y commits con el formato `<tipo>(<alcance>): <resumen>`, con alcance opcional.
- En cada pull request, describe el cambio, vincula el issue si existe y registra los comandos de verificación y sus resultados. Documenta las migraciones, los cambios de permisos y las decisiones de dominio cuando correspondan. Solicita revisión técnica para cambios en el esquema, el aislamiento o las reservas transaccionales.

## Verificación de código

- Consulta `package.json` y CI. Ejecuta `npm run lint`, `npm run typecheck` y `npm test` antes de dar una tarea por terminada. Usa el gestor, linter, formateador y framework de pruebas configurados. Si falta una herramienta o comando, deja constancia de la comprobación pendiente.
- Configura `TEST_DATABASE_URL` con una base de pruebas para verificar cambios que afecten disponibilidad, concurrencia, idempotencia o aislamiento entre sucursales.
- Prueba los horarios de apertura y cierre, la prioridad laboral, domingos, feriados, descansos, bloques de 20 más 10 minutos, cadencia de 30 minutos y los límites de 1 hora y 1 mes. Verifica UTC−6 de extremo a extremo y el formato de 24 horas.
- Prueba la ocupación al enviar el formulario, la expiración a los 15 minutos, el pago tardío, la reprogramación única con su límite de dos días, la conservación de las citas ante cambios de configuración y la liberación por inasistencia.
- Prueba solicitudes simultáneas para el mismo espacio y reintentos con la misma `Idempotency-Key`. Verifica que no se dupliquen reservas, cobros ni reembolsos.
- Prueba lecturas y escrituras directas al backend con identificadores de otra sucursal o negocio. Verifica que se apliquen los permisos por negocio y sucursal.

## Seguridad

- Aplica aislamiento multi-tenant y RBAC por sucursal en el backend. Verifica negocio, sucursal y permiso en cada operación protegida y limita las consultas al ámbito autorizado. Usa `mibarberia503` como identificador público del negocio. Los filtros del frontend no constituyen una barrera de acceso.
- Admite usuarios con membresías en varios negocios y propietarios con varias sucursales. Los empleados ven toda la agenda de su ámbito autorizado. El administrador invita, desactiva y cambia permisos. El administrador de plataforma puede acceder a los negocios.
- Respeta la regla declarada de que la recepcionista puede ver ingresos, cambiar precios y emitir reembolsos. Solo el administrador de sucursal autoriza reembolsos. Pide al equipo que aclare cómo coordinar la emisión y la autorización.
- Usa una `Idempotency-Key` para reservas, cobros y reembolsos. Vincúlala al ámbito de la operación y registra su resultado de forma atómica para evitar efectos duplicados incluso ante reintentos concurrentes.
- Consulta y mantén actualizadas la matriz de permisos y la decisión sobre aislamiento en [docs/arquitectura.md](docs/arquitectura.md). Registra allí las decisiones de dominio pendientes.

## Integración Frontend-Backend (Contratos Reales)

- El backend usa `business_id` y `branch_id` (NO `salon_id` ni `staffId`, y NO genera `manageToken`).
- El backend no maneja especialistas (`staff`) ni tokens de gestión pública. Las reservas se crean en `POST /negocios/:slug/sucursales/:branchId/reservas` únicamente con `{ firstName, lastName, serviceId, startsAt, paymentMode }` (con cabecera `idempotency-key`) y devuelven `{ id, status, starts_at, expires_at }`.
- Los pagos no admiten anticipos (`DEPOSIT`): solo se admite pago total online (`paymentMode: 'online'`) o pago en sucursal (`paymentMode: 'in_person'`).
- El flujo de reserva online es:
  1. Crear reserva (`POST /negocios/:slug/sucursales/:branchId/reservas`).
  2. Llamar a `/pagos/intent` (`POST /negocios/:slug/sucursales/:branchId/pagos/intent` enviando `{ appointmentId }`) para obtener `{ paymentId, clientSecret, amountMinor, status }`.
  3. Usar `clientSecret` con Stripe Elements.
- Abel y Karen ya pueden importar sus funciones reales (`getAvailableSlots`, `createBooking`, `createPaymentIntent`) desde `booking-portal/src/services/booking.service.ts` y solo deben reemplazar los Mocks por las llamadas reales en sus componentes `.tsx`.
