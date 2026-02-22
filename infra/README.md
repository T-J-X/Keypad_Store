# Local Infra (Docker Compose)

## Pinned Images
- PostgreSQL: `dhi.io/postgres:16.12-debian13`
- Redis: `dhi.io/redis:8.2.4-debian13`
- MinIO: `minio/minio:latest` (non-DHI by design)
- Mailpit: `axllent/mailpit:v1.29.1`
- ntfy: `binwiederhier/ntfy:v2.17.0`
- Watchtower: `containrrr/watchtower` (`--interval 300 --cleanup`)

## Start
```bash
pnpm run infra:pull
pnpm run infra:up
pnpm run infra:ps
```

Optional: if you maintain local env override files in `infra/` (for example `infra/.env.dev`), run Compose directly with `--env-file`:

```bash
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml -p vendure-dev up -d
```

## Stop
```bash
pnpm run infra:down
```

## Reset Data Volumes
```bash
pnpm run infra:reset
```

## Ports
- Postgres: `127.0.0.1:5432`
- Redis: `127.0.0.1:6379`
- MinIO API: `http://127.0.0.1:9000`
- MinIO Console: `http://127.0.0.1:9001`
- Mailpit UI: `http://127.0.0.1:8025` (SMTP `127.0.0.1:1025`)
- ntfy: `http://127.0.0.1:8088`

## Non-Root Runtime + Permissions
DHI runtime images are intentionally hardened and run without root by default.

This Compose setup uses Docker named volumes (`pg_data`, `redis_data`), which is the least invasive path and works on Docker Desktop and typical local Linux setups. If you change to Linux bind mounts later, ensure host directories are writable by the container users:
- Postgres: UID/GID `70:70`
- Redis: UID/GID `65532:65532`

## Troubleshooting
- Pull fails for `dhi.io/*` with auth errors:
  - Run `docker login dhi.io` and retry `pnpm run infra:pull`.
- `permission denied` on `/var/lib/postgresql/data`:
  - Run `docker compose ... down -v` then `up -d` to recreate named volumes.
  - For bind mounts, `chown -R 70:70 <postgres_data_dir>`.
- Redis cannot write `/data`:
  - Run `docker compose ... down -v` then `up -d`.
  - For bind mounts, `chown -R 65532:65532 <redis_data_dir>`.
- Container debugging feels limited:
  - Hardened runtime images are debug-unfriendly by design (minimal shell/tooling).
  - For local troubleshooting, temporarily switch to corresponding DHI `*-dev` tags, then revert to runtime tags.

## Notes
- Ports are bound to `127.0.0.1` (localhost only).
- This project does not use Elasticsearch in local infra.
- Watchtower monitors running containers and applies image updates automatically every 5 minutes.
