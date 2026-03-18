# GitPulse 🚀

**GitHub's Social Layer. Twitter's Feed Format.**

GitPulse is a developer-centric social platform built on top of the GitHub ecosystem. It allows developers to share "Ships" (releases), repo updates, and engage in social discussions with a premium, GitHub-inspired dark aesthetic.

![GitPulse Mobile Victory](file:///C:/Users/USER/.gemini/antigravity/brain/a37767e1-f6d0-4be3-8da8-348f05421660/mobile_view_victory_1773846641494.png)

## Core Features
- 🧵 **Social Feed**: Real-time updates from your GitHub network.
- 🚢 **Ship It**: Specialized post types for project releases with automated changelog formatting.
- 😁 **Reactions & Comments**: GitHub-style emoji reactions and nested comment threads.
- 📱 **Mobile First**: Fully responsive layout with a dedicated mobile navigation bar.
- ⚡ **Performance**: Next.js 15 App Router with high-fidelity loading skeletons.

## Technical Architecture
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: Neon (PostgreSQL)
- **ORM**: Prisma 6.1.0 (Windows-stabilized)
- **Auth**: NextAuth v5 (GitHub OAuth)
- **Styling**: Vanilla Tailwind CSS (GitHub Dark Theme)

## Getting Started

### 1. Prerequisites
- Node.js >= 18
- `pnpm` installed (`npm i -g pnpm`)
- A [Neon.tech](https://neon.tech) database.

### 2. Environment Setup
Create `apps/web/.env.local` with the following:
```env
# Database
DATABASE_URL="your-neon-url"

# Auth (GitHub OAuth)
AUTH_SECRET="your-secret"
GITHUB_ID="your-id"
GITHUB_SECRET="your-secret"
```

### 3. Installation & Run
```bash
# Install dependencies
pnpm install

# Generate Prisma Client (Stable v6.1.0)
cd apps/web
.\node_modules\.bin\prisma generate

# Run Development Server
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---
GitPulse | Built by Joseph
