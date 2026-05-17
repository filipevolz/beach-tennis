#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Starting Postgres+PostGIS (docker compose up -d)"
docker compose up -d

echo "==> Waiting for healthy container"
for _ in $(seq 1 30); do
  status="$(docker compose ps --format json 2>/dev/null | head -1 || true)"
  if docker compose ps | grep -q '(healthy)'; then
    break
  fi
  sleep 2
done

if ! docker compose ps | grep -q '(healthy)'; then
  echo "ERROR: postgres healthcheck did not pass in time" >&2
  docker compose ps >&2
  exit 1
fi

echo "==> PostGIS version"
version="$(docker compose exec -T postgres psql -U postgres -d beach_tennis -tAc "SELECT PostGIS_Version();")"
if [[ -z "${version// }" ]]; then
  echo "ERROR: PostGIS_Version() returned empty" >&2
  exit 1
fi
echo "PostGIS: $version"

echo "==> Volume persistence probe"
docker compose exec -T postgres psql -U postgres -d beach_tennis -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS dev_probe(id int primary key, note text);
INSERT INTO dev_probe(id, note) VALUES (1, 'persisted') ON CONFLICT (id) DO UPDATE SET note = EXCLUDED.note;
SQL

docker compose down
docker compose up -d

for _ in $(seq 1 30); do
  if docker compose ps | grep -q '(healthy)'; then
    break
  fi
  sleep 2
done

note="$(docker compose exec -T postgres psql -U postgres -d beach_tennis -tAc "SELECT note FROM dev_probe WHERE id = 1;")"
if [[ "$note" != "persisted" ]]; then
  echo "ERROR: expected persisted row after restart, got: '$note'" >&2
  exit 1
fi
echo "Volume persistence: OK"

echo "==> All infrastructure checks passed"
