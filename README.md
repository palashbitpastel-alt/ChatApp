# ChatApp

Real-time messaging web app built with **Next.js 16**, **Socket.io**, **Prisma**, and **PostgreSQL**. Next.js and the WebSocket server run in a single Node process, so the whole app deploys as one service.

## Features

**Messaging**
- One-on-one and group conversations, delivered instantly over WebSockets
- Typing indicators, online presence, and "last seen" timestamps
- Read receipts and emoji reactions
- Emoji picker and image messages (by URL)

**Administration** (`/admin`, admin accounts only)
- Usage statistics: users, online users, messages, chats, groups
- User moderation: search, suspend/unsuspend, promote/demote, delete
- System-wide announcements, shown to every connected user in real time

**Security**
- Passwords hashed with bcrypt; sessions in an httpOnly JWT cookie
- WebSocket connections authenticated with the same session cookie
- Every socket action checks that the user is a member of the chat
- The server refuses to start in production without a `JWT_SECRET`

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Real-time | Socket.io |
| Database | PostgreSQL via Prisma ORM |
| Runtime | Custom Node server (`server.ts`) running Next.js + Socket.io |

## Project structure

```
prisma/
  schema.prisma     Data model (users, chats, messages, reactions, broadcasts)
  seed.ts           Sample accounts and conversations
src/
  app/              Pages (chat, login, admin) and API routes
  components/       Chat UI and brand components
  lib/              Auth, JWT, Prisma client, socket client, brand config
server.ts           HTTP server: Next.js + authenticated Socket.io
start.sh            Container entrypoint: schema sync, seed, start server
Dockerfile          Production image
railway.json        Railway build/deploy config
```

The product name and default status text live in `src/lib/brand.ts`; the logo is `src/components/brand/BrandLogo.tsx` and the favicon is `src/app/icon.svg`.

## Running locally

Requirements: Node.js 20+, and PostgreSQL (or Docker).

```bash
npm install
cp .env.example .env          # then edit values if needed
docker compose up -d          # starts a local PostgreSQL
npx prisma db push            # create tables
npm run prisma:seed           # optional sample data
npm run dev                   # http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | In production | Long random string used to sign sessions (`openssl rand -hex 32`) |
| `NODE_ENV` | Yes | `development` locally, `production` when deployed |
| `PORT` | No | Port to listen on (default `3000`; Railway sets it automatically) |
| `SEED_DEMO_DATA` | No | Set to `false` to stop creating the sample accounts and chats on start-up |

## Deploying to Railway

1. Create a project and add a **PostgreSQL** database.
2. Add a service from this GitHub repository. Railway builds it with the `Dockerfile`.
3. In the service's **Variables**, set:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET` = a long random string
   - `NODE_ENV` = `production`
4. In **Settings → Deploy**, leave **Custom Start Command** empty or set it to `sh start.sh`.
5. In **Settings → Networking**, generate a public domain.

Every push to `main` redeploys automatically. On start-up the container syncs the database schema, runs the seed (safe to repeat), then starts the server. Keep the service at one replica: presence and socket rooms are held in memory, so multiple replicas would need a Socket.io Redis adapter.

## Sample accounts

The seed creates these accounts so you can try the app straight away. They use public passwords, so **remove them before inviting real users**:

1. Register your own account, sign in as `admin`, and use **Admin → Users** to make your account an admin.
2. In Railway, add the variable `SEED_DEMO_DATA` = `false` so the sample data is no longer recreated on each deploy.
3. Sign in with your own account and delete `admin`, `alice`, `bob`, and `charlie` from **Admin → Users**.

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |
| `alice` | `password123` | User |
| `bob` | `password123` | User |
| `charlie` | `password123` | User |
