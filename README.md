# GitPulse

GitHub's Social Layer. Twitter's Feed Format.

## Architecture

This is a monorepo managed with `pnpm` workspaces.

- `apps/web`: Next.js 15 App Router frontend (Tailwind + NextAuth v5)
- `apps/api`: Express.js REST API backend (Node.js)
- `packages/db`: Prisma ORM and database schema
- `packages/ui`: Shared shadcn/ui React components

## Local Development Setup

### 1. Prerequisites
- Node.js >= 18
- `pnpm` (`npm i -g pnpm`)
- PostgreSQL locally or via Supabase
- Redis (Upstash) for feed caching

### 2. Environment Variables
Copy the `.env.example` file to `.env.local` at the root, and configure it:
```bash
cp .env.example .env.local
```

You will need a GitHub OAuth App to run the web interface. See `docs/github_app_setup.md` for instructions.

### 3. Installation
Install all dependencies across the monorepo:
```bash
pnpm install
```

### 4. Running the Stack

**Run the web app (Frontend):**
```bash
pnpm --filter web dev
```
The Next.js app will be available at `http://localhost:3000`.

**Run the API (Backend):**
*(Note: API is pending implementation in Week 1)*
```bash
pnpm --filter api dev
```

## Built With
- Next.js 15
- Tailwind CSS (GitHub Dark Mode design system)
- Auth.js (NextAuth v5)
- Express
- Prisma
- NeonDB (PostgreSQL + Realtime)
- BullMQ
