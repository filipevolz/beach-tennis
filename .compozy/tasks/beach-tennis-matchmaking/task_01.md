---
status: completed
title: Fundação do monorepo e ambiente local
type: infra
complexity: low
dependencies: []
---

# Task 01: Fundação do monorepo e ambiente local

## Overview

Estabelece a base do repositório como monorepo pnpm com Postgres+PostGIS em Docker para desenvolvimento local. Sem esta fundação, backend e frontend não têm ambiente reproduzível nem variáveis de configuração partilhadas.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST criar `pnpm-workspace.yaml` incluindo `backend` e `frontend` como packages do workspace
- MUST adicionar `package.json` na raiz com scripts de conveniência (`dev`, `build`, `test` delegando aos packages quando existirem)
- MUST criar `docker-compose.yml` na raiz com serviço PostgreSQL 16+ com extensão PostGIS habilitada
- MUST criar `.env.example` na raiz com variáveis documentadas: `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `API_PORT`, `NEXT_PUBLIC_API_URL`, `DISCOVERY_DEFAULT_RADIUS_KM`, `LAUNCH_BOUNDS` (opcional)
- MUST criar `README.md` na raiz com instruções para subir Docker, copiar `.env`, e instalar dependências com pnpm
- MUST garantir que o volume Docker persiste dados entre restarts de desenvolvimento
- SHOULD expor porta Postgres padrão (5432) mapeada para o host
- MUST NOT implementar código de aplicação Nest ou Next nesta task
</requirements>

## Subtasks
- [x] 1.1 Configurar workspace pnpm com packages `backend/` e `frontend/`
- [x] 1.2 Adicionar Docker Compose com imagem Postgres+PostGIS e healthcheck
- [x] 1.3 Documentar variáveis de ambiente em `.env.example` e README
- [x] 1.4 Validar conexão à base de dados com extensão PostGIS ativa

## Implementation Details

Criar ficheiros de infraestrutura na raiz do repositório. Ver TechSpec secções **System Architecture**, **Technical Dependencies** e **Development Sequencing** (passo 1).

O repositório está greenfield: pastas `backend/` e `frontend/` existem vazias — não há código a modificar.

### Relevant Files
- `pnpm-workspace.yaml` — definir monorepo pnpm (criar)
- `package.json` — scripts raiz do workspace (criar)
- `docker-compose.yml` — Postgres+PostGIS local (criar)
- `.env.example` — template de configuração (criar)
- `README.md` — onboarding do projeto (criar)
- `backend/` — package placeholder referenciado pelo workspace (existente, vazio)
- `frontend/` — package placeholder referenciado pelo workspace (existente, vazio)

### Dependent Files
- `backend/package.json` — será adicionado na task 02; depende do workspace
- `frontend/package.json` — será adicionado na task 04; depende do workspace
- `backend/.env` — cópia local de `.env.example` (gitignored, criado pelo developer)

### Related ADRs
- [ADR-002: NestJS Backend with Next.js Frontend](../adrs/adr-002.md) — monorepo pnpm com `backend/` e `frontend/`
- [ADR-003: PostgreSQL with Prisma and PostGIS](../adrs/adr-003.md) — Postgres+PostGIS via Docker Compose

## Deliverables
- Monorepo pnpm funcional na raiz
- `docker-compose.yml` com Postgres+PostGIS e healthcheck
- `.env.example` e `README.md` com instruções de setup
- Script ou comando documentado que confirma `SELECT PostGIS_Version();` com sucesso
- Unit tests with 80%+ coverage **(REQUIRED)** — N/A para infra pura; substituir por script de verificação documentado no README
- Integration tests for database connectivity **(REQUIRED)** — script `docker compose up` + teste de conexão PostGIS

## Tests
- Unit tests:
  - [x] N/A — task de infraestrutura sem código de domínio; cobertura aplicável a scripts de verificação se criados
- Integration tests:
  - [x] `docker compose up -d` sobe o serviço Postgres sem erro de exit
  - [x] Healthcheck do container passa dentro do timeout configurado
  - [x] Conexão com `DATABASE_URL` do `.env.example` executa `SELECT PostGIS_Version()` e retorna versão não nula
  - [x] Segundo `docker compose up` reutiliza volume e mantém dados (insert + restart + select)
- Test coverage target: >=80% (aplicável apenas se forem criados scripts Node de verificação; caso contrário, checklist de integração acima é obrigatória)
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80% (ou checklist de integração infra completa se sem código testável)
- Developer consegue clonar, copiar `.env`, correr `docker compose up` e obter Postgres+PostGIS funcional em menos de 5 minutos
- Workspace pnpm reconhece `backend` e `frontend` como packages
