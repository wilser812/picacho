# Picacho — Guía de escalabilidad

Este documento lista los puntos **concretos del código actual** (no genéricos) que van a causar problemas cuando el tráfico o el volumen de datos crezcan, ordenados por prioridad. Cada punto indica el archivo exacto, por qué es un problema, y cómo resolverlo cuando llegue el momento — no hace falta arreglar nada de esto para el MVP con tráfico bajo, pero sí antes de escalar horizontalmente o de tener miles de pedidos/productos.

## Contexto: supuestos actuales de la arquitectura

Todo el código asume hoy:
- **Una sola instancia** de `apps/api` corriendo (no hay balanceo de carga).
- **Una sola conexión directa** a PostgreSQL (sin pooler externo).
- **Nada de caché** (ni Redis, ni CDN para assets).
- **Nada de colas** — todo se procesa de forma síncrona dentro del request HTTP.

Mientras el proyecto tenga un solo proceso de API y un volumen de datos moderado (cientos/pocos miles de filas por tabla), esto funciona bien. Los puntos de abajo son los que rompen ese supuesto.

---

## 🔴 Crítico — rompen con más de una instancia o carga moderada

### 1. WebSocket sin adaptador Redis
**Archivo:** `apps/api/src/tracking/tracking.gateway.ts`

Socket.io guarda las "rooms" (`order:${orderId}`) en la memoria de cada proceso. Si se corre más de una instancia de la API detrás de un balanceador de carga, un comprador conectado a la instancia A **nunca recibirá** la ubicación que un repartidor envía a la instancia B — el tracking en tiempo real se rompe silenciosamente en cuanto haya 2+ instancias.

**Fix cuando se necesite escalar horizontalmente:** agregar `@socket.io/redis-adapter` + una instancia de Redis, y configurar el adapter en el bootstrap de Nest (`app.useWebSocketAdapter(...)` con el `IoAdapter` extendido).

### 2. Checkout multi-vendedor sin transacción
**Archivo:** `apps/api/src/orders/orders.service.ts` (método `createFromCart`)

Cuando el carrito tiene productos de varios vendedores, se crean varios `Order` con `Promise.all(...)`, cada uno con su propio `prisma.order.create` independiente. Si el segundo falla (ej. constraint, timeout de conexión bajo carga), el primero **queda creado** sin rollback: el comprador termina con un pedido "fantasma" parcial.

**Fix:** envolver la creación de todos los pedidos del carrito en `this.prisma.$transaction([...])` (o `$transaction(async (tx) => ...)` si se necesita lógica entre pasos).

### 3. Ningún endpoint pagina resultados
**Archivos:** `admin.service.ts`, `vendor.service.ts`, `driver.service.ts`, `products.service.ts`, `orders.service.ts` — **todos** los `findMany` actuales devuelven la tabla completa (verificado: cero usos de `take`/`skip`/`cursor` en todo `apps/api/src`).

Endpoints como `/admin/products`, `/admin/orders`, `/admin/users`, `/vendor/products`, `/vendor/orders`, `/driver/orders/available` van a intentar traer y serializar **toda la tabla** en cada request. Con unos pocos miles de filas esto empieza a ser lento y pesado tanto para la API como para el cliente que lo renderiza. (`/products/search` es la excepción — ya tiene `LIMIT 20` en el SQL crudo).

**Fix:** agregar `take`/`skip` (o paginación por cursor) con un tamaño de página máximo fijo (ej. 50) a todos los listados, y parámetros `page`/`cursor` en los controllers correspondientes.

---

## 🟠 Alto — se sienten antes de lo que parece

### 4. `DriverLocation` crece sin límite
**Archivo:** `apps/api/prisma/schema.prisma` (modelo `DriverLocation`), usado desde `tracking.gateway.ts`

Cada ping de ubicación (cada ~4 segundos mientras un pedido está "en camino", ver `apps/driver/app/index.tsx`) hace un **INSERT** nuevo, nunca un update ni una limpieza. Con uso real, esta tabla se convierte en la más grande de la base en cuestión de semanas, y ralentiza la consulta de "última ubicación conocida" (`orderBy: updatedAt desc` sin índice compuesto por repartidor+tiempo reciente).

**Fix:** o bien hacer `upsert` de una sola fila "última ubicación" por repartidor (y guardar el histórico en otra tabla/solo si se necesita), o agregar un job periódico que borre ubicaciones con más de X horas.

### 5. PostgreSQL sin pooler externo
**Archivo:** `apps/api/.env` (`DATABASE_URL`)

Prisma abre su propio pool de conexiones por proceso. Con una sola instancia no pasa nada, pero en cuanto se agreguen más instancias de la API (o funciones serverless), cada una abre su propio pool y se puede agotar `max_connections` de Postgres rápidamente.

**Fix:** poner PgBouncer delante de Postgres (o el pooler administrado del proveedor — Supabase, Neon, RDS Proxy todos traen uno), y/o limitar `connection_limit` en la `DATABASE_URL` de Prisma.

### 6. Faltan índices para las consultas más comunes de admin/vendor
**Archivo:** `apps/api/prisma/schema.prisma` (modelo `Order`)

`Order` no tiene ningún `@@index` propio (a diferencia de `Product` o `DriverLocation`). Consultas frecuentes como "pedidos de este vendedor" (`vendorId`), "pedidos disponibles para repartidores" (`status = PREPARING AND driverId IS NULL`) o "pedidos de este comprador" (`buyerId`) van a hacer table scan en cuanto haya varios miles de filas.

**Fix:** agregar índices compuestos según los patrones de consulta reales, por ejemplo `@@index([vendorId, status])`, `@@index([buyerId])`, `@@index([status, driverId])`.

### 7. CORS abierto a cualquier origen
**Archivo:** `apps/api/src/main.ts`

`app.enableCors()` sin opciones permite cualquier origen. No es un problema de carga, pero hay que cerrarlo a `WEB_URL` (y a los esquemas de las apps móviles si aplica) antes de producción — más relevante en cuanto haya varios entornos/dominios.

### 8. Sin rate limiting
**Archivo:** `apps/api/src/main.ts` (no hay ningún guard/interceptor de throttling)

`/auth/login` y `/products/search` son los más expuestos: el primero a fuerza bruta de contraseñas, el segundo a scraping/abuso ya que no requiere autenticación.

**Fix:** `@nestjs/throttler` con límites distintos por endpoint (más estricto en `/auth/*`).

---

## 🟡 Medio — no urgente, pero hay que saber que están ahí

### 9. Notificaciones push síncronas dentro del request
**Archivo:** `apps/api/src/notifications/notifications.service.ts`, llamado desde `vendor.service.ts` y `driver.service.ts`

`sendToUser` hace un `fetch()` a la API de Expo **dentro** del mismo request que cambia el estado del pedido. Está envuelto en `try/catch` así que nunca rompe la respuesta al usuario, pero sí la retrasa unos milisegundos, y con mucho volumen concurrente de cambios de estado esto no escala bien.

**Fix cuando duela:** mover el envío a una cola (ej. BullMQ + Redis) en vez de awaitearlo inline.

### 10. Imágenes de producto sin almacenamiento real
**Archivo:** `apps/api/prisma/schema.prisma` (`Product.imageUrl` es solo un `String?`)

Todavía no hay subida de archivos implementada — es una decisión de alcance del MVP, no un bug. Cuando se implemente (S3/Cloudflare R2, como estaba planeado desde el inicio), servir las imágenes vía CDN, no desde el propio backend de NestJS.

### 11. Sin observabilidad
No hay logging estructurado, métricas ni tracing — solo los logs por defecto de NestJS. Antes de tener tráfico real conviene tener al menos: logs estructurados (JSON) enviados a un servicio centralizado, y una alerta básica de errores 5xx.

---

## Ruta de escalado sugerida (en orden)

1. **Ahora (MVP, tráfico bajo):** no se necesita nada de esta lista todavía.
2. **Antes de exponerlo a usuarios reales:** puntos 2, 3, 7, 8 (transacción del checkout, paginación, CORS, rate limiting) — son correctitud/seguridad más que escala pura, y son baratos de arreglar ahora.
3. **Cuando se note lentitud con más datos:** puntos 4 y 6 (limpieza de `DriverLocation`, índices en `Order`).
4. **Cuando se necesite más de una instancia de la API:** puntos 1 y 5 (Redis adapter para WebSocket, pooler de conexiones) — estos dos son bloqueantes para escalar horizontalmente, no opcionales.
5. **Cuando el volumen de pedidos/notificaciones sea alto:** punto 9 (cola para notificaciones), punto 11 (observabilidad).
