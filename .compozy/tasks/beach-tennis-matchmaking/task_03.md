---
status: completed
title: Backend Venue, Availability, Match e Booking
type: backend
complexity: critical
dependencies:
  - task_02
---

# Task 03: Backend Venue, Availability, Match e Booking

## Overview

Entrega os módulos de domínio do marketplace: venues publicam slots, jogadores criam e preenchem matches, e bookings reservam slots de forma transacional. É o núcleo funcional do MVP no lado da API.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implementar `VenueModule` com CRUD de venue do manager, `POST/GET /venues/:id/courts`, e ownership checks (403 em recursos alheios)
- MUST implementar `AvailabilityModule` com publicação, listagem geo, e cancelamento de slots (`status`: `available` | `reserved` | `cancelled`)
- MUST implementar queries de discovery com `ST_DWithin` usando `lat`, `lng`, `radiusKm` dos query params
- MUST implementar `MatchModule` conforme interface `IMatchService` no TechSpec (secção **Core Interfaces**)
- MUST limitar spots: singles = 2, doubles = 4; retornar erro `MATCH_FULL` quando lotado
- MUST suportar `visibility: public` (aparece em `GET /matches`) e `visibility: invite` (excluído do índice público; acesso via `GET /matches/invite/:code`)
- MUST gerar `inviteCode` como token URL-safe de 128 bits para matches invite-only
- MUST implementar `BookingModule` conforme `IBookingService` no TechSpec com confirmação transacional
- MUST prevenir double-booking com constraint unique em `availabilitySlotId` para bookings confirmados e HTTP 409 em conflito
- MUST validar que slot está `available` antes de confirmar booking
- MUST permitir apenas o creator do match confirmar booking no MVP
- MUST implementar transições de estado de match: `forming` → `open` → `ready_to_book` → `booked`
- MUST criar factories de teste em `backend/test/factories/` para seed de modelos
</requirements>

## Subtasks
- [x] 3.1 Implementar VenueModule e endpoints de courts com localização PostGIS
- [x] 3.2 Implementar AvailabilityModule com publicação e discovery geo de slots
- [x] 3.3 Implementar MatchModule (criar, discovery público, invite, join, leave)
- [x] 3.4 Implementar BookingModule (create, confirm, cancel) com transação anti double-book
- [x] 3.5 Adicionar testes unitários por serviço (Match, Booking, guards de ownership)
- [x] 3.6 Adicionar testes de integração Supertest com Testcontainers Postgres+PostGIS

## Implementation Details

Ver TechSpec secções **Core Interfaces**, **API Endpoints** (Venues, Availability, Matches, Bookings), **Testing Approach** (Unit e Integration Tests), e **Development Sequencing** (passos 4–5, 7–8).

Padrão de erros: `HttpException` com `code` estável (`SLOT_NOT_AVAILABLE`, `MATCH_FULL`, `FORBIDDEN`). Ver TechSpec **Error convention**.

### Relevant Files
- `backend/src/venue/venue.module.ts` — VenueModule (criar)
- `backend/src/venue/venue.controller.ts` — endpoints `/venues/*` (criar)
- `backend/src/venue/venue.service.ts` — lógica de venue e courts (criar)
- `backend/src/availability/availability.module.ts` — AvailabilityModule (criar)
- `backend/src/availability/availability.controller.ts` — endpoints `/availability-slots` (criar)
- `backend/src/availability/availability.service.ts` — slots e queries geo (criar)
- `backend/src/match/match.module.ts` — MatchModule (criar)
- `backend/src/match/match.controller.ts` — endpoints `/matches/*` (criar)
- `backend/src/match/match.service.ts` — lifecycle de matches e spots (criar)
- `backend/src/match/match.service.interface.ts` — contrato IMatchService (criar)
- `backend/src/booking/booking.module.ts` — BookingModule (criar)
- `backend/src/booking/booking.controller.ts` — endpoints `/bookings/*` (criar)
- `backend/src/booking/booking.service.ts` — reserva transacional (criar)
- `backend/src/booking/booking.service.interface.ts` — contrato IBookingService (criar)
- `backend/test/factories/` — helpers de seed por modelo (criar)
- `backend/test/match.e2e-spec.ts` — testes integração match (criar)
- `backend/test/booking.e2e-spec.ts` — testes integração booking (criar)

### Dependent Files
- `backend/src/app.module.ts` — importar novos módulos
- `backend/prisma/schema.prisma` — modelos já definidos na task 02; migrations adicionais se necessário
- `backend/src/auth/roles.guard.ts` — reutilizado para proteção por papel
- `backend/src/prisma/prisma.service.ts` — acesso à DB

### Related ADRs
- [ADR-001: Balanced Marketplace MVP](../adrs/adr-001.md) — dois lados do marketplace na API
- [ADR-003: PostgreSQL with Prisma and PostGIS](../adrs/adr-003.md) — queries geo e integridade relacional
- [ADR-005: Venue Slots Only; Public and Invite-Only Matches](../adrs/adr-005.md) — separação slot/match/booking e visibilidade

## Deliverables
- Todos os endpoints Venues, Availability, Matches e Bookings do TechSpec funcionais
- Factories de teste em `backend/test/factories/`
- Testes unitários MatchService e BookingService com cobertura >=80%
- Testes de integração dos 3 cenários do TechSpec (happy path, invite oculto, booking concorrente)
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for marketplace API flows **(REQUIRED)**

## Tests
- Unit tests:
  - [x] `MatchService.create` com format `singles` cria exatamente 2 `MatchSpot` com status `open`
  - [x] `MatchService.create` com format `doubles` cria exatamente 4 spots
  - [x] `joinSpot` no 3.º jogador em match singles retorna erro com `code: MATCH_FULL`
  - [x] `findPublicNearby` nunca retorna matches com `visibility: invite`
  - [x] `findByInviteCode` com código válido retorna match; código inválido retorna 404
  - [x] `BookingService.confirm` com slot `available` marca slot `reserved` e match `booked`
  - [x] `BookingService.confirm` com slot já `reserved` retorna 409 com `code: SLOT_NOT_AVAILABLE`
  - [x] Geração de `inviteCode` produz valores únicos em 1000 iterações (teste estatístico)
- Integration tests:
  - [x] Cenário 1: venue manager publica slot → player cria match público → join → booking confirm → slot `reserved`
  - [x] Cenário 2: match `invite` não aparece em `GET /matches?lat=...&lng=...` mas é acessível via `/matches/invite/:code`
  - [x] Cenário 3: dois `POST /bookings/:id/confirm` concorrentes no mesmo slot → exatamente um 201/200 e um 409
  - [x] `venue_manager` recebe 403 em `POST /matches`
  - [x] Manager B recebe 403 ao `PATCH /availability-slots/:id` de slot do Manager A
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Fluxo happy path do TechSpec **Integration Tests** executa end-to-end via Supertest
- Nenhum match invite aparece no índice público
- Double-booking impossível ao nível de DB e API (409 verificado)
