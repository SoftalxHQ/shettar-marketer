# Shettar Marketer

Marketer/affiliate portal for Shettar (Next.js).

## Requirements

- Node.js (LTS recommended)
- `pnpm` (this repo pins `pnpm@10.x` in `package.json`)

## Setup

```bash
pnpm install
cp .env.example .env
```

Update `.env` as needed:

- `NEXT_PUBLIC_API_URL`: Rails API base URL (no trailing slash)
- `MARKETER_PORTAL_URL`: this app’s base URL (no trailing slash). This should also be set on the API so emails can deep-link back to the portal.

## Run locally

```bash
pnpm dev
```

App runs on `http://localhost:3005`.

## Scripts

```bash
pnpm dev      # start dev server (port 3005)
pnpm build    # production build
pnpm start    # start production server (port 3005)
pnpm lint     # eslint
```

## Notes

- Auth token is stored in `localStorage` under `marketer_token`.
