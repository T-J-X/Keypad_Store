# Keypad Store

A modern e-commerce storefront for custom keypads.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm run dev
```

`pnpm run dev` starts backend first and waits for `http://localhost:3000/health` before launching the storefront, so `/shop` does not race backend startup.

To run local infrastructure only (Postgres/Redis/MinIO via Docker Compose):

```bash
pnpm run infra:pull
pnpm run infra:up
pnpm run infra:ps
```

DHI-specific image and troubleshooting notes are in `/Users/terry/keypad-store/infra/README.md`.
