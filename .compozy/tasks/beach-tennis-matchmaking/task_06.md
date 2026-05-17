---
status: completed
title: Pipeline CI
type: infra
complexity: medium
dependencies:
  - task_03
---

# Task 06: Pipeline CI

## Overview

Adiciona pipeline de integração contínua no GitHub Actions para validar lint, testes e build de backend e frontend em cada pull request. Garante que o marketplace API e a app web não regressam após merges.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST criar workflow GitHub Actions em `.github/workflows/` executado em `pull_request` e `push` para branch principal
- MUST instalar dependências com pnpm usando cache de store
- MUST executar lint em `backend` e `frontend` (ESLint configurado em cada package)
- MUST executar testes unitários do backend com cobertura reportada
- MUST executar testes de integração do backend com serviço Postgres+PostGIS (service container GitHub Actions ou Testcontainers)
- MUST executar build de `backend` e `frontend` sem erros
- MUST falhar o job se qualquer step de test ou build falhar
- SHOULD publicar artefacto de relatório de cobertura (opcional, não bloqueante no MVP)
- MUST NOT fazer deploy para produção nesta task
</requirements>

## Subtasks
- [x] 6.1 Configurar ESLint e scripts `lint` em backend e frontend
- [x] 6.2 Criar workflow CI com job de testes backend (unit + integration)
- [x] 6.3 Adicionar steps de build frontend e backend no workflow
- [x] 6.4 Validar pipeline localmente com `act` ou push de teste (documentar no README)
- [x] 6.5 Garantir que pipeline falha quando teste propositadamente quebrado é introduzido (smoke validation)

## Implementation Details

Ver TechSpec secção **Impact Analysis** (`.github/workflows`), **Testing Approach**, e **Development Sequencing** (passo 13 CI).

Backend integration tests da task 03 requerem Postgres+PostGIS — usar `services:` no GitHub Actions com imagem `postgis/postgis` ou Testcontainers conforme já implementado na task 03.

### Relevant Files
- `.github/workflows/ci.yml` — pipeline principal (criar)
- `backend/package.json` — scripts `lint`, `test`, `test:cov`, `build` (modificar)
- `frontend/package.json` — scripts `lint`, `test`, `build` (modificar)
- `backend/.eslintrc.js` ou `eslint.config.mjs` — regras lint backend (criar)
- `frontend/eslint.config.mjs` — regras lint frontend (criar)
- `pnpm-workspace.yaml` — workspace referenciado pelo CI (existente, task 01)
- `README.md` — badge CI e instruções (modificar)

### Dependent Files
- `backend/test/*.e2e-spec.ts` — testes executados no CI (task 03)
- `backend/src/**/*.spec.ts` — unit tests (tasks 02–03)
- `docker-compose.yml` — referência local; CI usa service container equivalente

### Related ADRs
- [ADR-002: NestJS Backend with Next.js Frontend](../adrs/adr-002.md) — dois packages no pipeline
- [ADR-003: PostgreSQL with Prisma and PostGIS](../adrs/adr-003.md) — serviço DB no job de integração

## Deliverables
- Workflow GitHub Actions funcional em PRs
- Scripts lint/test/build em ambos os packages
- Documentação no README com badge de status CI
- Validação documentada de que pipeline bloqueia merge em falha de testes
- Unit tests with 80%+ coverage **(REQUIRED)** — executados no CI, não criados nesta task
- Integration tests for CI pipeline itself **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] N/A — esta task valida testes existentes, não adiciona lógica de domínio
- Integration tests:
  - [ ] Workflow `ci.yml` executa com sucesso em branch com código das tasks 02–05
  - [ ] Step `pnpm --filter backend test` passa com Postgres service container healthy
  - [ ] Step `pnpm --filter backend test:e2e` (ou equivalente) passa cenários da task 03
  - [ ] Step `pnpm --filter frontend build` completa sem erro TypeScript
  - [ ] Introduzir `expect(true).toBe(false)` temporário em spec → job CI falha (reverter após validação)
  - [ ] Cache pnpm reduz tempo de install em segunda execução (verificar logs, não bloqueante)
- Test coverage target: >=80% (reportado no job backend; falha se abaixo do threshold configurado)
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80% no relatório do job backend
- Badge CI verde no README após push
- PR não pode mergear com testes vermelhos (branch protection recomendada na documentação)
- Build de produção (`backend` + `frontend`) reproduzível no CI
