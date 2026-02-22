# Postgres Best-Practices Audit

Date: 2026-02-22
Scope: `/Users/terry/keypad-store/apps/backend` (Vendure + TypeORM + Postgres)

## Connection and Pool Policy (TypeORM/Vendure)

Observed baseline:
- DB wiring is in `/Users/terry/keypad-store/apps/backend/src/index.ts` under `dbConnectionOptions`.
- TypeORM uses the `pg` driver with direct Postgres connections.
- `synchronize` is env-controlled (`DB_SYNCHRONIZE`), defaulting to `true` in non-production and `false` in production.

Low-risk improvements applied:
- Added explicit pool and timeout controls in `dbConnectionOptions.extra`:
  - `max` (`DB_POOL_MAX`)
  - `connectionTimeoutMillis` (`DB_CONNECTION_TIMEOUT_MS`)
  - `query_timeout` (`DB_QUERY_TIMEOUT_MS`)
  - `statement_timeout` (`DB_STATEMENT_TIMEOUT_MS`)
  - `idleTimeoutMillis` (`DB_IDLE_TIMEOUT_MS`)
  - `idle_in_transaction_session_timeout` (`DB_IDLE_IN_TX_TIMEOUT_MS`)
- Added env example defaults in `/Users/terry/keypad-store/apps/backend/.env.example`.

Why this is low-risk:
- No API/contract changes.
- Uses standard `pg` connection options passed through TypeORM.
- Constrains runaway/idle workloads and caps pool growth.

## Index Coverage for Known Query Paths

Primary high-frequency path inspected:
- Saved configurations in:
  - `/Users/terry/keypad-store/apps/backend/src/plugins/base-shop/saved-designs/saved-configuration.service.ts`
  - `/Users/terry/keypad-store/apps/backend/src/plugins/base-shop/saved-designs/saved-configuration.entity.ts`

Observed query shapes:
- List by customer, newest first:
  - `WHERE customerId = ? ORDER BY updatedAt DESC`
- Fetch single owned configuration:
  - `WHERE id = ? AND customerId = ?`

Low-risk improvements applied:
- Added composite index: `idx_saved_configuration_customer_updated_at` on `(customerId, updatedAt)`.
- Reduced join overhead by filtering on `savedConfiguration.customerId` directly instead of joining to `customer` for ownership checks.

Notes:
- The primary key index already covers `id`.
- Composite index supports the customer-scoped list query and improves sort locality for `updatedAt DESC` scans.

## Migration Discipline

Observed baseline:
- No explicit migration files/pipeline found in backend source.
- Schema drift control currently relies heavily on `synchronize` in non-production.

Assessment:
- For production safety, index/schema changes should be applied via explicit migrations (or a reviewed SQL migration process), with `DB_SYNCHRONIZE=false`.

Recommended discipline (next step, not applied in this phase):
- Introduce migration generation/review/apply workflow in CI/CD.
- Treat schema changes (including indexes) as versioned artifacts.

## Locking and Concurrency Considerations

Observed patterns:
- Saved configuration writes are short single-entity operations (save/update/delete) with no long-running application-side transaction scope.
- Ownership checks and customer resolution are query-first and do not hold explicit row locks across external calls.

Risk assessment:
- Current plugin code has low lock-contention risk for the audited paths.
- Main concurrency risk is operational (unbounded sessions or long-running queries), now mitigated with explicit timeouts and pool caps.

## Validation

Commands run:
- `pnpm -C /Users/terry/keypad-store/apps/backend typecheck` ✅
- `pnpm -C /Users/terry/keypad-store/apps/backend build` ✅

Files changed in Phase 8:
- `/Users/terry/keypad-store/apps/backend/src/index.ts`
- `/Users/terry/keypad-store/apps/backend/.env.example`
- `/Users/terry/keypad-store/apps/backend/src/plugins/base-shop/saved-designs/saved-configuration.entity.ts`
- `/Users/terry/keypad-store/apps/backend/src/plugins/base-shop/saved-designs/saved-configuration.service.ts`
