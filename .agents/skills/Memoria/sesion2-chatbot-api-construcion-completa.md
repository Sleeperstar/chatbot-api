# Sesión 2 — Construcción completa del chatbot-api

**Fecha:** 2026-05-02  
**Proyecto:** `chatbot-api` (Node.js + Express + OpenAI + Supabase)

---

## Qué se construyó

REST API de chatbot multiturno con interfaz gráfica web, construida desde cero.

### Stack
- **Runtime:** Node.js con ES Modules (`"type": "module"`)
- **Framework:** Express 5
- **IA:** OpenAI SDK — modelo `gpt-4o-mini`
- **Base de datos:** Supabase (`@supabase/supabase-js`) — proyecto "Sesion2"
- **Tests:** Jest 29 + Supertest (configuración especial para ESM)

---

## Estructura final del proyecto

```
chatbot-api/
  src/
    server.js                  # Entry point, sirve API + archivos estáticos
    routes/
      chat.js                  # POST /api/chat
      chat.test.js             # Tests con Jest mock
      conversations.js         # GET /api/conversations, GET /api/conversations/:id/messages
    services/
      chat.js                  # Lógica multiturno: historial + OpenAI + Supabase
      openai.js                # Cliente OpenAI singleton
      supabase.js              # Cliente Supabase singleton
  public/
    index.html                 # SPA — interfaz gráfica en tema oscuro
  supabase/
    schema.sql                 # DDL: tablas conversations y messages
  .env.example                 # Variables de entorno (OPENAI_API_KEY vacía, resto completado)
  package.json
  CLAUDE.md
  .gitignore
```

---

## Base de datos Supabase (proyecto "Sesion2")

URL: `https://vtkjgdvrjcmpsncbcyqr.supabase.co`

Tablas creadas vía MCP:
```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

create index messages_conversation_id_idx on messages(conversation_id);
```

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/chat` | Envía mensaje, retorna `{ conversationId, message }` |
| GET | `/api/conversations` | Lista todas las conversaciones |
| GET | `/api/conversations/:id/messages` | Historial de una conversación |
| GET | `/` | Sirve la interfaz gráfica (`public/index.html`) |

---

## Flujo multiturno

1. Si no hay `conversationId`, se crea una nueva conversación en Supabase
2. Se recupera el historial completo de mensajes de esa conversación
3. Se envía a OpenAI: `[system, ...historial, mensajeActual]`
4. La respuesta del asistente se persiste en Supabase
5. Se retorna `{ conversationId, message }` al cliente

---

## Interfaz gráfica (`public/index.html`)

SPA en vanilla JS, tema oscuro, sin dependencias externas:
- Sidebar izquierdo con lista de conversaciones (cargadas desde `/api/conversations`)
- Botón "Nueva conversación"
- Área de mensajes con avatares diferenciados (usuario azul / IA verde)
- Animación de typing dots mientras espera respuesta
- Textarea con auto-resize; `Enter` envía, `Shift+Enter` salto de línea
- Carga historial completo al hacer clic en una conversación del sidebar

---

## Comandos

```bash
npm run dev    # Servidor con hot-reload (node --watch)
npm start      # Producción
npm test       # Jest con soporte ESM
```

---

## Problemas resueltos durante la sesión

| Problema | Solución |
|----------|----------|
| Jest + ESM: imports `.js` no resueltos | `moduleNameMapper: {"^(\\.{1,2}/.*)\\.js$": "$1"}` en package.json |
| `__dirname` no existe en ESM | `dirname(fileURLToPath(import.meta.url))` |
| `Cannot GET /` en raíz | Comportamiento normal; se agregó `express.static` para servir la GUI |
