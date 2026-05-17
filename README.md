# Beach Tennis Matchmaking

[![CI](https://github.com/filipevolz/beach-tennis/actions/workflows/ci.yml/badge.svg)](https://github.com/filipevolz/beach-tennis/actions/workflows/ci.yml)

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
- `pnpm --filter @beach-tennis/backend lint` runs backend ESLint checks.
- `pnpm --filter @beach-tennis/frontend lint` runs frontend ESLint checks.

## Continuous integration

GitHub Actions runs `.github/workflows/ci.yml` on every `pull_request` and every `push` to `main`. The pipeline is split into four failing jobs:

- `lint` installs dependencies with `pnpm` and validates backend plus frontend ESLint.
- `backend-unit` runs `pnpm --filter @beach-tennis/backend test:unit`, enforces the existing 80% Jest coverage threshold, and uploads `backend/coverage` as an artifact.
- `backend-integration` starts `postgis/postgis:16-3.4`, applies Prisma migrations, and runs `pnpm --filter @beach-tennis/backend test:e2e`.
- `build` runs reproducible production builds for both workspace packages.

The workflow does not deploy anything. A failed lint, test, migration, or build step fails the job and blocks the pull request once branch protection is enabled for `main`.

## Local CI validation

Install dependencies once:

```bash
pnpm install
```

Run the same checks used by CI:

```bash
pnpm --filter @beach-tennis/backend lint
pnpm --filter @beach-tennis/frontend lint
pnpm --filter @beach-tennis/backend test:unit
docker compose up -d
pnpm --filter @beach-tennis/backend prisma:migrate
pnpm --filter @beach-tennis/backend test:e2e
pnpm --filter @beach-tennis/backend build
pnpm --filter @beach-tennis/frontend build
```

If you use `act`, run the workflow locally with a full runner image because the integration job needs Docker-in-Docker support:

```bash
act pull_request -W .github/workflows/ci.yml -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:full-latest
```

## Smoke validation

To confirm the pipeline blocks bad merges, introduce a temporary failure such as `expect(true).toBe(false)` in a backend unit spec, run the workflow or open a PR, verify that `backend-unit` fails, and then revert the change before merging.

Recommended repository setting: require the `CI` workflow to pass before merging into `main`.
