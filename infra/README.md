
cd infra
cp .env.dev.example .env.dev
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d

cd infra
cp .env.lab.example .env.lab
docker compose --env-file .env.lab -f docker-compose.lab.yml up -d
docker compose --env-file .env.dev -f docker-compose.dev.yml down
docker compose --env-file .env.lab -f docker-compose.lab.yml down

docker compose --env-file .env.dev -f docker-compose.dev.yml down
docker compose --env-file .env.lab -f docker-compose.lab.yml down
docker compose --env-file .env.dev -f docker-compose.dev.yml down
ocker compose --env-file .env.lab -f docker-compose.lab.yml down
docker compose --env-file .env.dev -f docker-compose.dev.yml down -v
docker compose --env-file .env.lab -f docker-compose.lab.yml down -v
- Postgres: 127.0.0.1:5432
- Redis:    127.0.0.1:6379
- MinIO:    http://127.0.0.1:9000 (API), http://127.0.0.1:9001 (console)
- Mailpit:  http://127.0.0.1:8025 (UI), SMTP 127.0.0.1:1025
- ntfy:     http://127.0.0.1:8088
- Postgres: 127.0.0.1:5433
- Redis:    127.0.0.1:6380
- MinIO:    http://127.0.0.1:9100 (API), http://127.0.0.1:9101 (console)
- Mailpit:  http://127.0.0.1:8026 (UI), SMTP 127.0.0.1:1026
- ntfy:     http://127.0.0.1:8089
Notes:
- Ports are bound to 127.0.0.1 (localhost only).
- We are NOT using Elasticsearch in this project.
