---
status: completed
title: Frontend scaffold, cliente API e autenticação
type: frontend
complexity: medium
dependencies:
  - task_02
---

# Task 04: Frontend scaffold, cliente API e autenticação

## Overview

Cria a aplicação Next.js com App Router, cliente HTTP tipado para a API NestJS, e fluxos de login/registo com routing por papel. Esta task desbloqueia as UIs de produto na task 05 sem repetir trabalho de auth.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST criar app Next.js (App Router) em `frontend/` com TypeScript
- MUST configurar `NEXT_PUBLIC_API_URL` apontando para `/api/v1` do backend
- MUST implementar cliente API com interceptor que anexa `Authorization: Bearer <accessToken>` em requests autenticados
- MUST implementar páginas de registo com seleção explícita de papel (`player` ou `venue_manager`)
- MUST implementar login e armazenamento seguro de access token (memória/context) e refresh token (httpOnly cookie ou estratégia documentada no TechSpec ADR-004)
- MUST implementar refresh automático de access token antes de expirar ou em resposta 401 retryable
- MUST implementar layout base mobile-first com navegação distinta por papel após login
- MUST proteger rotas: jogador não acede a área de venue manager e vice-versa
- MUST aplicar tokens de design de `DESIGN.md` na raiz (cores, tipografia, espaçamento) no layout e componentes base
- MUST NOT implementar fluxos de discovery, matches ou slots nesta task (task 05)
</requirements>

## Subtasks
- [x] 4.1 Scaffold Next.js App Router com estrutura `app/` e `features/`
- [x] 4.2 Implementar cliente API tipado e gestão de tokens JWT
- [x] 4.3 Implementar páginas e formulários de login e registo por papel
- [x] 4.4 Implementar layout, navegação e guards de rota por role
- [x] 4.5 Adicionar testes de componentes e utilitários de auth

## Implementation Details

Ver TechSpec secção **System Architecture** (Frontend), ADR-002 (estrutura `frontend/app/` e `frontend/features/`), ADR-004 (auth web), ADR-006 (mobile-first base).

Referir `DESIGN.md` na raiz para tokens visuais — não duplicar paleta aqui.

### Relevant Files
- `frontend/package.json` — dependências Next.js, React, cliente HTTP (criar)
- `frontend/next.config.ts` — configuração Next.js e env públicas (criar)
- `frontend/tsconfig.json` — TypeScript frontend (criar)
- `frontend/app/layout.tsx` — layout raiz mobile-first (criar)
- `frontend/app/page.tsx` — landing ou redirect por auth (criar)
- `frontend/app/(auth)/login/page.tsx` — página de login (criar)
- `frontend/app/(auth)/register/page.tsx` — registo com escolha de papel (criar)
- `frontend/features/auth/api.ts` — chamadas `/auth/*` (criar)
- `frontend/features/auth/auth-context.tsx` — estado de sessão e tokens (criar)
- `frontend/features/auth/role-guard.tsx` — proteção de rotas por papel (criar)
- `frontend/lib/api-client.ts` — cliente HTTP com Bearer e refresh (criar)
- `frontend/components/ui/` — botões, inputs, labels acessíveis (criar)
- `DESIGN.md` — referência de design system (existente)

### Dependent Files
- `backend/src/auth/auth.controller.ts` — endpoints consumidos pelo cliente
- `.env.example` — `NEXT_PUBLIC_API_URL` definido na task 01
- `frontend/app/(player)/` — rotas player placeholder para task 05
- `frontend/app/(venue)/` — rotas venue placeholder para task 05

### Related ADRs
- [ADR-002: NestJS Backend with Next.js Frontend](../adrs/adr-002.md) — separação frontend/API REST
- [ADR-004: JWT Authentication with Single-Role RBAC](../adrs/adr-004.md) — fluxo de tokens e papel único
- [ADR-006: Mobile-First Web via Next.js PWA](../adrs/adr-006.md) — layout responsivo base

## Deliverables
- App Next.js executável com login, registo e logout funcionais contra API da task 02
- Cliente API reutilizável para task 05
- Layout e navegação por papel (`player` / `venue_manager`)
- Testes de componentes auth e utilitários de token
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for auth UI flows **(REQUIRED)**

## Tests
- Unit tests:
  - [x] `api-client` anexa header `Authorization: Bearer <token>` quando access token presente no context
  - [x] `api-client` não anexa Authorization em rotas públicas de auth (register/login)
  - [x] `role-guard` redireciona `player` que tenta aceder rota `venue_manager` para página de unauthorized
  - [x] `role-guard` redireciona utilizador não autenticado para `/login`
  - [x] Parser de resposta de erro extrai `code` do body da API para mensagem de UI
  - [x] Formulário de registo rejeita submissão sem papel selecionado (validação client-side)
- Integration tests:
  - [x] Registo como `player` com API mock/real → redirect para área player
  - [x] Registo como `venue_manager` → redirect para área venue
  - [x] Login com credenciais inválidas exibe mensagem de erro sem crash
  - [x] Logout limpa tokens e redireciona para `/login`
  - [x] Refresh token renova access token e request subsequente a `/players/me` sucede
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `pnpm --filter frontend build` completa sem erros
- Utilizador consegue registar-se, fazer login, e ver shell de navegação correto por papel
- Rotas protegidas bloqueiam acesso cross-role
