# Picacho

Marketplace de delivery de abarrotes y comida (tipo Rappi/PedidosYa) para Latinoamérica. Monorepo con backend, web y dos apps móviles (comprador y repartidor).

## Estructura del monorepo

```
apps/
  api/      Backend NestJS + Prisma + PostgreSQL
  web/      Next.js — tienda pública, panel de vendedor (/vendor), panel de admin (/admin)
  mobile/   Expo (React Native) — app del comprador
  driver/   Expo (React Native) — app del repartidor
packages/
  shared/   Tipos, esquemas Zod, cliente API, tokens de marca, árbol de categorías (compartido por todas las apps)
```

## Stack técnico

- **Backend**: NestJS, Prisma ORM, PostgreSQL, JWT (auth con roles: BUYER/VENDOR/DRIVER/ADMIN), Socket.io (tracking en tiempo real), Mercado Pago SDK (con fallback mock para desarrollo local sin credenciales).
- **Web**: Next.js (App Router), Tailwind v4.
- **Móvil**: Expo Router, NativeWind, `@react-native-async-storage/async-storage`, `socket.io-client`, `expo-notifications`, `expo-location`.
- **Marca**: paleta Picacho (verde `#0D8A4B`, naranja `#F97316`, fondo `#F8F9FA`, texto `#1F2937`) — fuente única en `packages/shared/src/theme.ts`.

## Requisitos previos

- Node.js 24+ y pnpm (`corepack enable` o `npm i -g pnpm`)
- PostgreSQL 16+ corriendo localmente (o vía `docker-compose up -d` si tienes Docker)
- Para las apps móviles: Expo Go en tu teléfono, o un emulador Android/iOS

## Puesta en marcha

```bash
# 1. Instalar dependencias de todo el monorepo
pnpm install

# 2. Configurar variables de entorno (copiar y ajustar cada .env.example)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
cp apps/driver/.env.example apps/driver/.env

# 3. Base de datos: crear las tablas y cargar datos de prueba
cd apps/api
pnpm prisma:migrate
pnpm db:seed
cd ../..

# 4. Levantar API + Web en paralelo
pnpm dev

# 5. Levantar las apps móviles (en terminales separadas)
pnpm --filter mobile start
pnpm --filter driver start
```

- Web: http://localhost:3000
- API: http://localhost:3001

### Usuarios de prueba (creados por el seed)

| Rol | Email | Password |
|---|---|---|
| Admin | `admin@picacho.pe` | `changeme123` |
| Vendedor (aprobado) | `vendedor.demo@picacho.pe` | `changeme123` |

Los compradores y repartidores se crean registrándose desde la propia app.

## Variables de entorno clave (`apps/api/.env`)

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Firma de tokens — cambiar en producción |
| `JWT_EXPIRES_IN` | Duración del token (7d en MVP; no hay refresh tokens todavía) |
| `MP_ACCESS_TOKEN` | Token de Mercado Pago. Vacío = usa el checkout simulado de desarrollo |
| `API_URL` / `WEB_URL` | Usadas para construir links de retorno de pago y notificaciones |

## Flujo funcional implementado

1. **Catálogo y búsqueda** — categorías fijas, productos esenciales ordenados por precio, búsqueda con autocompletado (Postgres `pg_trgm`).
2. **Cuentas, carrito y checkout** — registro/login, carrito persistido, creación de pedido (se divide automáticamente por vendedor), pago vía Mercado Pago o checkout simulado.
3. **Panel de vendedor** (`/vendor`) — registro de tienda (queda pendiente de aprobación), CRUD de productos, gestión de pedidos propios.
4. **Logística y tracking** — app de repartidor separada (`apps/driver`): acepta pedidos "en preparación", comparte ubicación en vivo por WebSocket; el comprador ve al repartidor en el mapa, puede llamarlo y ver su ubicación en tiempo real.
5. **Panel de administración** (`/admin`) — aprobar/rechazar vendedores (solo tiendas aprobadas aparecen en el catálogo público), moderar productos, ver pedidos y usuarios globales, configurar la comisión de la plataforma.
6. **Notificaciones push y offline** — cada cambio de estado de pedido dispara una notificación push (Expo); la app del comprador cachea el catálogo visitado para verlo sin conexión.

## Despliegue

- **API**: `apps/api/Dockerfile` (multi-stage, build desde la raíz del repo: `docker build -f apps/api/Dockerfile -t picacho-api .`). Pensado para Railway/Render — al arrancar corre `prisma migrate deploy` automáticamente. *No se pudo probar la build real porque Docker no está instalado en el entorno donde se generó.*
- **Web**: Vercel detecta Next.js automáticamente; solo configurar `NEXT_PUBLIC_API_URL` en las variables de entorno del proyecto.
- **Mobile / Driver**: `eas.json` ya está listo en ambas apps. Falta vincular una cuenta EAS propia (`eas init`) para obtener un `projectId` real — sin eso, ni el build de producción ni las notificaciones push funcionan.
- **Pagos reales**: configurar `MP_ACCESS_TOKEN` con credenciales de producción de Mercado Pago.

## Escalabilidad

Ver [SCALABILITY.md](SCALABILITY.md) para la lista concreta de cuellos de botella conocidos del código actual (paginación, WebSocket multi-instancia, transacciones, índices, etc.) y el orden recomendado para resolverlos.

## Limitaciones conocidas (decisiones de alcance del MVP)

- **JWT sin refresh tokens**: expira a los 7 días; para producción real conviene añadir rotación de refresh tokens.
- **Push notifications**: el código está completo, pero requiere un `projectId` de EAS para emitir tokens reales.
- **Ubicación del repartidor**: se comparte solo en primer plano (foreground). Compartir en segundo plano requeriría configurar un `TaskManager` de Expo.
- **"Ver en Mapa"**: abre Google Maps centrado en la última coordenada conocida del repartidor (no es una sesión de "ubicación en vivo" nativa de Maps, ya que Google no expone esa función a apps de terceros). El tracking realmente en vivo se ve en el mapa embebido dentro de la propia app.
