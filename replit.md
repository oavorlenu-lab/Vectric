# Vectric

A full-stack blog/publishing platform running at [vectric.online](https://vectric.online). React/Vite frontend, Express API, Supabase PostgreSQL + Storage.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `SUPABASE_DATABASE_URL` — Supabase Transaction Pooler connection string (port 6543)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080)
- Frontend: React + Vite (port 18615)
- DB: PostgreSQL (Supabase) + Drizzle ORM
- Storage: Supabase Storage (all uploads go here — no local disk)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/vectric/` — React/Vite frontend
- `artifacts/api-server/` — Express API server
- `lib/db/` — Drizzle schema + migrations
- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/api-client-react/` — generated React Query hooks
- `lib/api-zod/` — generated Zod schemas

## Architecture decisions

- All media uploads go to Supabase Storage via the API server using `SUPABASE_SERVICE_ROLE_KEY`. Replit Object Storage is not used.
- Images are compressed to WebP (max 2000px, 82% quality) on upload via `sharp`. SVGs and GIFs pass through unchanged.
- DB connections always use the Transaction Pooler URL (port 6543) with `family:4` (IPv4) — Supabase direct port 5432 is IPv6-only and unreachable from Replit.
- CORS is driven by the `CORS_ORIGIN` env var (comma-separated list). In dev, all origins are allowed.
- AI writing assistant uses Groq API (`api.groq.com`, model `llama-3.3-70b-versatile`). The DB field is named `grokApiKey` for historical reasons.

## Product

- Blog/publishing platform with categories, tags, authors, and full SEO metadata
- Admin panel for posts, media, settings, newsletter subscribers, and comments
- Newsletter subscriptions (no user accounts for public visitors)
- Contact page, maintenance mode, Google Analytics injection

## User preferences

- All storage must go to Supabase — never to local disk or Replit Object Storage
- Production domain: `vectric.online`

## Gotchas

- Always use Transaction Pooler URL (port 6543) for DB — never port 5432
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- Run `pnpm --filter @workspace/db run push` after any schema change
- The `API Server` workflow (port 8080) may fail due to port conflict with the artifact workflow — this is harmless; use `artifacts/api-server: API Server` as the authoritative one

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
