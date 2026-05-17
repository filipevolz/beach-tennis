---
status: completed
title: Frontend fluxos MVP e PWA
type: frontend
complexity: critical
dependencies:
  - task_03
  - task_04
---

# Task 05: Frontend fluxos MVP e PWA

## Overview

Implementa todas as jornadas de produto do MVP no frontend: venue managers publicam slots, jogadores descobrem matches, juntam-se a spots, e confirmam bookings. Inclui PWA installável e polish mobile-first conforme PRD.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implementar fluxo venue manager: criar/editar venue, adicionar courts, publicar slots, listar e cancelar slots próprios
- MUST implementar fluxo player: browse matches públicos com filtros (geo, format, skillLevel), detalhe de match com spots, criar match (público ou invite), join/leave spot
- MUST implementar fluxo de booking: selecionar slot disponível, criar booking pendente, confirmar (organizer), exibir estados claros (forming, open, booked)
- MUST implementar partilha de link invite (`/matches/invite/:code`) com copy-to-clipboard
- MUST distinguir visualmente "juntar-se a match" vs "reservar slot de venue" (mitigação PRD risco de confusão)
- MUST usar geolocalização do browser para "perto de mim" com fallback para entrada manual de coordenadas ou cidade
- MUST adicionar `manifest.json` e service worker com cache apenas de assets estáticos (network-first para API)
- MUST garantir tap targets >=44px, CTAs sticky em detalhe de match, labels acessíveis em estados de booking
- MUST aplicar design tokens de `DESIGN.md` em todas as páginas de produto
- SHOULD usar Server Components para listas de discovery onde possível (ADR-006)
</requirements>

## Subtasks
- [x] 5.1 Implementar features venue: perfil, courts, publicação e gestão de slots
- [x] 5.2 Implementar features player: discovery, criar match, detalhe, join/leave
- [x] 5.3 Implementar fluxo de booking na UI player (selecionar slot → confirmar)
- [x] 5.4 Implementar fluxo invite-only (criar match invite, partilhar link, resolver por código)
- [x] 5.5 Adicionar PWA (manifest, service worker, meta tags mobile)
- [x] 5.6 Adicionar testes de componentes e testes de integração dos fluxos críticos

## Implementation Details

Ver TechSpec **API Endpoints** (todos os recursos), PRD **Core Features** e **User Experience**, ADR-005 (semântica slot vs match), ADR-006 (PWA).

Organizar UI em `frontend/features/venues/`, `frontend/features/matches/`, `frontend/features/bookings/`, `frontend/features/discovery/`.

### Relevant Files
- `frontend/features/venues/venue-form.tsx` — criar/editar venue (criar)
- `frontend/features/venues/court-list.tsx` — gestão de courts (criar)
- `frontend/features/venues/slot-publisher.tsx` — publicar availability slots (criar)
- `frontend/features/venues/slot-list.tsx` — listar/cancelar slots (criar)
- `frontend/features/discovery/match-list.tsx` — browse matches públicos (criar)
- `frontend/features/discovery/geo-filter.tsx` — raio e geolocalização (criar)
- `frontend/features/matches/match-detail.tsx` — spots e join/leave (criar)
- `frontend/features/matches/create-match-form.tsx` — criar match público/invite (criar)
- `frontend/features/matches/invite-share.tsx` — copy link invite (criar)
- `frontend/app/(venue)/dashboard/page.tsx` — hub venue manager (criar)
- `frontend/app/(venue)/slots/page.tsx` — gestão de slots (criar)
- `frontend/app/(player)/discover/page.tsx` — discovery de matches (criar)
- `frontend/app/(player)/matches/[id]/page.tsx` — detalhe e booking (criar)
- `frontend/app/matches/invite/[code]/page.tsx` — resolver invite link (criar)
- `frontend/features/bookings/booking-flow.tsx` — seleção slot e confirmação (criar)
- `frontend/public/manifest.json` — PWA manifest (criar)
- `frontend/next.config.ts` — integração PWA plugin (modificar)

### Dependent Files
- `frontend/lib/api-client.ts` — cliente da task 04
- `frontend/features/auth/auth-context.tsx` — sessão e tokens
- `frontend/features/auth/role-guard.tsx` — proteção de rotas
- `backend/src/*` — todos os endpoints da task 03

### Related ADRs
- [ADR-001: Balanced Marketplace MVP](../adrs/adr-001.md) — jornadas player e venue na UI
- [ADR-005: Venue Slots Only; Public and Invite-Only Matches](../adrs/adr-005.md) — UX separada slot vs match vs booking
- [ADR-006: Mobile-First Web via Next.js PWA](../adrs/adr-006.md) — PWA e performance mobile

## Deliverables
- Fluxos venue manager completos (perfil → courts → slots)
- Fluxos player completos (discovery → join → book)
- Fluxo invite link funcional
- PWA instalável com manifest válido
- Testes de componentes e integração dos fluxos críticos
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for MVP user journeys **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] `match-list` renderiza badge "N vagas" correto para match doubles com 2 spots `open`
  - [ ] `create-match-form` com visibility `invite` não exibe opção de aparecer em discovery público
  - [ ] `booking-flow` desabilita botão Confirmar quando slot selecionado tem `status: reserved`
  - [ ] `invite-share` copia URL `https://<host>/matches/invite/<code>` para clipboard
  - [ ] `slot-publisher` valida `endsAt` posterior a `startsAt` antes de submissão
  - [ ] `geo-filter` usa `DISCOVERY_DEFAULT_RADIUS_KM` quando utilizador não concede geolocalização
- Integration tests:
  - [ ] Fluxo venue (API real/mock): login manager → criar venue → adicionar court → publicar slot → slot visível em GET `/availability-slots`
  - [ ] Fluxo player: login → criar match público → join spot → selecionar slot → confirm booking → UI mostra estado `booked`
  - [ ] Match invite: criar match invite → aceder via `/matches/invite/:code` sem estar no feed público
  - [ ] Erro 409 de slot ocupado exibe mensagem com código `SLOT_NOT_AVAILABLE` sem crash
  - [ ] Página discovery responsiva em viewport 375px sem overflow horizontal crítico
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Jornadas PRD **User Stories** executáveis end-to-end na UI contra API da task 03
- Distinção visual clara entre match open spots e venue time slots
- PWA passa auditoria Lighthouse PWA básica (manifest + service worker registado)
- Layout utilizável em mobile (tap targets, estados de loading/erro)
