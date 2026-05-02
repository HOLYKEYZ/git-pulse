# gitPulse

> a developer-first social platform built on top of github. share updates, ship releases, and discover trending projects — all in one place.

## features

- **social feed** — post updates with markdown, hashtags, and @mentions
- **ship releases** — announce new versions directly from your github repos
- **trending hub** — real-time trending repos and developers scraped from github
- **profile pages** — contribution heatmaps, pinned repos, achievements, and readme rendering
- **explore** — discover trending hashtags, upcoming projects, and most active repos
- **real-time updates** — server-sent events (sse) for instant feed delivery
- **api integrations** — programmatic posting via api keys + github actions workflow
- **theming** — github dark and midnight theme support

## tech stack

| layer     | technology                 |
| --------- | -------------------------- |
| framework | next.js 15 (app router)    |
| language  | typescript                 |
| styling   | tailwind css               |
| database  | postgresql (neon)          |
| orm       | prisma                     |
| auth      | nextauth.js (github oauth) |
| monorepo  | pnpm workspaces            |
| hosting   | vercel                     |

## getting started

### prerequisites

- node.js 20+
- pnpm 8+
- postgresql database (neon recommended)
- github oauth app credentials

### setup

```bash
# clone the repository
git clone https://github.com/HOLYKEYZ/git-pulse.git
cd git-pulse

# install dependencies
pnpm install

# configure environment variables
cp apps/web/.env.example apps/web/.env.local
```

### environment variables

create `apps/web/.env.local` with:

```env
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=your_postgresql_connection_string
```

### database setup

```bash
# generate prisma client
cd apps/web
npx prisma generate

# push schema to database
npx prisma db push
```

### development

```bash
# from root directory
pnpm run dev
```

the app will be available at `http://localhost:3000`.

## project structure

```
git-pulse/
├── apps/
│   └── web/                    # next.js application
│       ├── prisma/             # database schema
│       ├── src/
│       │   ├── app/            # next.js app router pages & api routes
│       │   ├── components/     # react components
│       │   └── lib/            # utilities, auth, github api, prisma client
│       └── public/             # static assets
├── .github/
│   └── workflows/              # ci/cd and gitpulse api action
└── package.json
```

## api

gitpulse provides a programmatic api for creating posts. generate an api key in **settings → api & integrations**, then:

```bash
curl -X POST https://git-pulse.vercel.app/api/posts \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "hello from the api!", "type": "standard"}'
```

### github action integration

auto-post to gitpulse when you publish a release:

```yaml
name: Post to GitPulse
on:
  release:
    types: [published]
jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: fjogeleit/http-request-action@v1
        with:
          url: "https://git-pulse.vercel.app/api/posts"
          method: "POST"
          customHeaders: '{"Authorization": "Bearer ${{ secrets.GITPULSE_TOKEN }}"}'
          data: '{"content": "shipped ${{ github.event.release.tag_name }}!", "type": "standard"}'
```

add your api key as `GITPULSE_TOKEN` in your repo's **settings → secrets → actions**.

## contributing

1. fork the repository
2. create a feature branch
3. commit your changes
4. push to the branch
5. open a pull request

## license

this project is open source under the [MIT License](LICENSE).
