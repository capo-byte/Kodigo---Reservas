# Kodigo Reservas

API de disponibilidad y reservas para barberías con varias sucursales. Usa Fastify, TypeScript y PostgreSQL.

## Dependencias del proyecto

El proyecto usa Node.js 24 o posterior y npm para instalar las dependencias del proyecto en `node_modules`. El archivo `package-lock.json` fija las versiones que instala `npm ci`.

| Paquete | Para qué se usa |
|---|---|
| `fastify` | Servidor HTTP y rutas de la API. |
| `pg` | Conecta Node.js con un servidor PostgreSQL y administra el conjunto de conexiones. |
| `zod` | Valida parámetros y cuerpos de las solicitudes. |
| `typescript` y `tsx` | Comprueban y compilan TypeScript, o ejecutan el código directamente durante desarrollo. |
| `eslint` y `typescript-eslint` | Revisan el código fuente y las pruebas. |
| `@types/node` y `@types/pg` | Proporcionan tipos para Node.js y su cliente PostgreSQL. |

## Preparar la base de datos local

### 1. Instalar y arrancar PostgreSQL

Instala PostgreSQL 16 o posterior con el paquete o instalador de tu sistema. Asegúrate de tener el servidor y las herramientas de consola `psql` y `pg_isready`. Arranca el servicio de PostgreSQL con el mecanismo indicado por tu instalación y anota el puerto y el usuario administrador que configuraste. [Descargas oficiales de PostgreSQL](https://www.postgresql.org/download/).

En la **terminal del sistema**, ejecuta:

```text
psql --version
pg_isready -h 127.0.0.1 -p 5432
```

El primer comando confirma que el cliente está disponible. El segundo debe mostrar `accepting connections`, que indica que el servidor escucha en esa dirección. Si tu instalación usa otro puerto, reemplaza `5432` en los comandos y en `.env`.

### 2. Crear el usuario y la base del proyecto

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

### 3. Comprobar el acceso como usuario del proyecto

En la **terminal del sistema**, ejecuta:

```text
psql -h 127.0.0.1 -p 5432 -U reservas -d reservas -W
```

`-W` hace que el cliente te pida la contraseña que elegiste para `reservas`. El indicador `reservas=>` señala que entraste a la base. Ejecuta `\conninfo` para comprobar la base, el usuario, el host y el puerto. Después, escribe `\q` para salir y continuar con la configuración del proyecto.

### 4. Configurar la conexión y aplicar las migraciones

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

### 5. Verificar las tablas y cargar datos iniciales

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

## Ejecutar la API

Sal de `psql` con `\q` y ejecuta `npm run dev` en la terminal del sistema, desde la raíz del repositorio. Para ejecutar el código compilado, usa `npm run build` y después `npm start`. El [contrato de la API](docs/arquitectura.md#api) documenta las rutas y permisos.

## Errores frecuentes

| Mensaje o síntoma | Qué revisar |
|---|---|
| La terminal indica que `psql` no existe | Instala las herramientas de consola de PostgreSQL. Si ya están instaladas, agrega su directorio de ejecutables a `PATH` y abre una terminal nueva. |
| `connection refused` o `no response` | Arranca el servicio de PostgreSQL y verifica el puerto con `pg_isready`. |
| `role "reservas" does not exist` | Revisa `\du reservas` desde la sesión del administrador y crea el rol antes de asignar su contraseña o crear la base. |
| `database "reservas" does not exist` | Revisa `\l reservas` y crea la base en la misma instancia a la que te conectas. |
| `password authentication failed` | Comprueba el usuario y su contraseña. Escribe la contraseña original en `psql` y la versión codificada si corresponde en `.env`. |
| `\dt` no muestra tablas | Ejecuta `\conninfo` y verifica que coincida con la conexión en `.env`. Si estás en `postgres`, usa `\c reservas`. Luego ejecuta `\dt public.*`. Si sigue vacío, revisa el resultado de `npm run migrate`. |

## Verificación del código

Ejecuta `npm run lint`, `npm run typecheck` y `npm test` antes de solicitar revisión. Para ejecutar la integración con PostgreSQL, configura `TEST_DATABASE_URL` con una base de pruebas separada. El usuario de pruebas necesita permiso para crear esquemas. La suite crea y elimina su propio esquema.
