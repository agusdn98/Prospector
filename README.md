# Prospector · SnapTable

CRM en formato Kanban para prospectar bares, restaurantes y similares, pensado para el equipo comercial de SnapTable. Busca negocios por zona con Google Maps, arma el pipeline de contacto y permite mandar el primer email desde Gmail o sincronizar los leads a una Google Sheet — todo vía [Composio](https://dashboard.composio.dev/agusdn98_workspace/~/connect).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- SQLite + Prisma como base de datos local
- `@composio/core` para Google Maps, Gmail y Google Sheets

## Puesta en marcha (local)

1. Instalá dependencias:

   ```bash
   npm install
   ```

2. Copiá `.env.example` a `.env.local` y completá tu API key de Composio (la sacás de [dashboard.composio.dev/agusdn98_workspace/~/connect](https://dashboard.composio.dev/agusdn98_workspace/~/connect)):

   ```bash
   cp .env.example .env.local
   ```

   ```
   DATABASE_URL="file:./dev.db"
   COMPOSIO_API_KEY="tu-api-key"
   COMPOSIO_USER_ID="default"
   ```

   `DATABASE_URL` también tiene que estar en un archivo `.env` (Prisma CLI no lee `.env.local`); ya viene creado.

3. Creá la base de datos local:

   ```bash
   npx prisma db push
   ```

4. Levantá la app:

   ```bash
   npm run dev
   ```

   Abrí [http://localhost:3000](http://localhost:3000).

5. Andá a **Conexiones** (esquina superior derecha) y conectá Google Maps, Gmail y Google Sheets. Cada botón "Conectar" abre una pestaña de Composio para autorizar tu cuenta — quedan asociadas al `COMPOSIO_USER_ID` que configuraste (por defecto `default`).

6. En la misma pantalla de Conexiones, pegá el ID de la Google Sheet donde querés que se sincronicen los leads (está en la URL de la planilla: `docs.google.com/spreadsheets/d/ESTE-ES-EL-ID/edit`).

## Cómo se usa

- **Buscar prospectos**: elegí rubro (bar, restaurante, cafetería...) y zona, la app trae los negocios desde Google Maps y los agrega como leads nuevos en la columna "Nuevo".
- **Pipeline**: arrastrá las tarjetas entre columnas (Nuevo → Primer contacto → ... → Cualificado → Ganado/Perdido) para reflejar el estado real de cada conversación.
- **Ficha del lead**: click en "Ver ficha" para ver el detalle, cambiar etapa/prioridad, agregar notas, llamar/escribir WhatsApp, mandar el email de prospección por Gmail o sincronizar ese lead a Google Sheets.

## Nota sobre las acciones de Composio

Los slugs exactos de las acciones de Google Maps y Google Sheets se resuelven en tiempo de ejecución contra la API real de Composio (`src/lib/composio.ts`, función `resolveTool`), en vez de estar hardcodeados — así la app no depende de adivinar el nombre exacto de cada acción. Si alguna búsqueda o sincronización falla con un error de "no encontramos acciones", revisá que el toolkit correspondiente esté conectado en `/conexiones`.
