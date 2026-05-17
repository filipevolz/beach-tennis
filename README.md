# Beach Tennis Matchmaking

Monorepo foundation for the Beach Tennis marketplace MVP. The repository is organized as a `pnpm` workspace with separate `backend/` and `frontend/` packages, and uses PostgreSQL 16 with PostGIS for local development.

## Prerequisites

- Node.js 20+
- `pnpm` 10+
- Docker with Docker Compose support

## Local setup

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Install workspace dependencies:

   ```bash
   pnpm install
   ```

3. Start PostgreSQL with PostGIS:

   ```bash
   docker compose up -d
   ```

4. Wait for the container healthcheck to report healthy:

   ```bash
   docker compose ps
   ```

## Verification

Run the full infrastructure check (healthcheck, PostGIS, volume persistence):

```bash
pnpm verify:infra
```

Or verify PostGIS manually:

```bash
docker compose exec postgres psql -U postgres -d beach_tennis -c "SELECT PostGIS_Version();"
```

Expected result: one row with a non-null PostGIS version string.

## Workspace scripts

- `pnpm dev` runs `dev` in workspace packages when those package scripts exist.
- `pnpm build` runs `build` in workspace packages when those package scripts exist.
- `pnpm test` runs `test` in workspace packages when those package scripts exist.

Application code for NestJS and Next.js is intentionally deferred to later tasks.
