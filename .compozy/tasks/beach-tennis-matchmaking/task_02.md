---
status: completed
title: Backend scaffold, Prisma, Auth e Player
type: backend
complexity: high
dependencies:
  - task_01
---

# Task 02: Backend scaffold, Prisma, Auth e Player

## Overview

Implementa o serviço NestJS com schema Prisma completo do MVP, autenticação JWT com RBAC de papel único, e o módulo de perfil do jogador. Esta task entrega a API base que o resto do backend e o frontend consomem.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST criar app NestJS em `backend/` com `main.ts`, `app.module.ts`, e configuração global (validation pipe, CORS para origem do frontend, prefixo `/api/v1`)
- MUST definir schema Prisma com todos os modelos MVP: `User`, `PlayerProfile`, `VenueManagerProfile`, `Venue`, `Court`, `AvailabilitySlot`, `Match`, `MatchSpot`, `Booking` — ver TechSpec secção **Data Models**
- MUST habilitar PostGIS na migração inicial e armazenar localizações como geography Point 4326 (Prisma `Unsupported` + raw SQL onde necessário)
- MUST implementar `PrismaService` como provider global
- MUST implementar `AuthModule` com `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- MUST usar bcrypt para passwords e emitir access + refresh JWT com payload `sub`, `role`, `email`
- MUST atribuir exatamente um papel por conta em registo: `player` ou `venue_manager`
- MUST implementar `JwtStrategy`, `RolesGuard`, decorator `@Roles()`, e `@CurrentUser()`
- MUST criar perfil associado ao registo (`PlayerProfile` ou `VenueManagerProfile`) conforme o papel
- MUST implementar `PlayerModule` com `GET /players/me` e `PATCH /players/me` (apenas role `player`)
- MUST retornar erros com `HttpException` e campo `code` estável no body
- MUST mapear violações unique do Prisma para HTTP 409
- SHOULD usar logging estruturado JSON (pino) com `requestId`, `userId`, `route`, `durationMs`
</requirements>

## Subtasks
- [x] 2.1 Scaffold NestJS, Prisma, migração inicial com PostGIS e todos os modelos MVP
- [x] 2.2 Implementar AuthModule (register, login, refresh) com guards e estratégia JWT
- [x] 2.3 Implementar PlayerModule com endpoints de perfil e validação de campos MVP
- [x] 2.4 Adicionar testes unitários de Auth e PlayerModule
- [x] 2.5 Adicionar testes de integração Supertest para fluxos de registo e perfil

## Implementation Details

Ver TechSpec secções **Core Interfaces**, **Data Models**, **API Endpoints** (Auth e Players), **Testing Approach** (Unit Tests), e **Development Sequencing** (passos 2–3 e 6 parcial).

Interfaces de serviço e contratos detalhados estão no TechSpec — não duplicar aqui. Criar `backend/src/auth/`, `backend/src/player/`, `backend/prisma/schema.prisma`.

### Relevant Files
- `backend/package.json` — dependências NestJS, Prisma, JWT, bcrypt (criar)
- `backend/nest-cli.json` — configuração Nest CLI (criar)
- `backend/tsconfig.json` — TypeScript backend (criar)
- `backend/prisma/schema.prisma` — modelos de dados MVP (criar)
- `backend/prisma/migrations/` — migração inicial PostGIS (criar)
- `backend/src/main.ts` — bootstrap API com prefixo `/api/v1` (criar)
- `backend/src/app.module.ts` — módulo raiz (criar)
- `backend/src/prisma/prisma.service.ts` — cliente Prisma global (criar)
- `backend/src/auth/auth.module.ts` — AuthModule (criar)
- `backend/src/auth/auth.controller.ts` — endpoints `/auth/*` (criar)
- `backend/src/auth/auth.service.ts` — lógica register/login/refresh (criar)
- `backend/src/auth/jwt.strategy.ts` — validação JWT (criar)
- `backend/src/auth/roles.guard.ts` — RBAC por papel (criar)
- `backend/src/player/player.module.ts` — PlayerModule (criar)
- `backend/src/player/player.controller.ts` — endpoints `/players/me` (criar)
- `backend/src/player/player.service.ts` — CRUD perfil jogador (criar)
- `backend/test/` — testes e2e Supertest (criar)

### Dependent Files
- `.env` / `DATABASE_URL` — conexão definida na task 01
- `docker-compose.yml` — Postgres+PostGIS da task 01
- `frontend/` — consumirá endpoints de auth na task 04

### Related ADRs
- [ADR-002: NestJS Backend with Next.js Frontend](../adrs/adr-002.md) — stack e estrutura `backend/src/`
- [ADR-003: PostgreSQL with Prisma and PostGIS](../adrs/adr-003.md) — ORM e tipos geoespaciais
- [ADR-004: JWT Authentication with Single-Role RBAC](../adrs/adr-004.md) — auth e um papel por conta

## Deliverables
- App NestJS executável com migrações Prisma aplicadas
- Endpoints Auth e Player funcionais conforme TechSpec
- Testes unitários Auth + Player com cobertura >=80%
- Testes de integração Supertest para registo e perfil
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for auth and player profile **(REQUIRED)**

## Tests
- Unit tests:
  - [x] `POST /auth/register` com role `player` cria User + PlayerProfile e retorna 201
  - [x] `POST /auth/register` com role `venue_manager` cria User + VenueManagerProfile e retorna 201
  - [x] `POST /auth/register` com email duplicado retorna 409 com `code` estável
  - [x] `POST /auth/login` com credenciais válidas retorna `accessToken` e `refreshToken`
  - [x] `POST /auth/login` com password errada retorna 401
  - [x] `POST /auth/refresh` com refresh token válido retorna novo `accessToken`
  - [x] `POST /auth/refresh` com token expirado ou inválido retorna 401
  - [x] `RolesGuard` bloqueia `venue_manager` em rota `@Roles('player')` com 403
  - [x] `PlayerService` rejeita `skillLevel` fora do enum permitido com 400
- Integration tests:
  - [x] Fluxo completo: register player → login → GET `/players/me` com Bearer token retorna perfil
  - [x] PATCH `/players/me` atualiza `displayName` e `skillLevel` e persiste na DB
  - [x] Request sem `Authorization` header em `/players/me` retorna 401
  - [x] `venue_manager` autenticado recebe 403 em `GET /players/me`
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `pnpm --filter backend test` executa sem falhas
- API responde em `/api/v1/auth/*` e `/api/v1/players/me` com contratos do TechSpec
- Migração Prisma aplica todos os modelos MVP sem erro
