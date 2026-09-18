# 🚀 Complete Railway Deployment Guide: WhatsApp Web Clone

This full-stack WhatsApp Web application is pre-configured for instant deployment on **Railway** with persistent WebSockets, Next.js App Router, Prisma ORM, and PostgreSQL.

---

## ⚡ Method 1: Deploy with Railway Dashboard (Recommended)

### Step 1: Push Project to GitHub
Initialize your Git repository and push the project to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: Fullstack WhatsApp Web Clone"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

### Step 2: Create a New Project on Railway
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **"+ New Project"**.
3. Select **"Provision PostgreSQL"** to add a managed PostgreSQL database.

---

### Step 3: Deploy the Next.js Web Service
1. In the same project canvas, click **"+ Create"** or **"+ New"** -> **"GitHub Repo"**.
2. Select your repository (`YOUR_REPO_NAME`).
3. Railway will automatically detect the `Dockerfile` and `railway.json`.

---

### Step 4: Configure Environment Variables
In your web service's **Variables** tab on Railway, configure the following:

| Variable | Recommended Value | Notes |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway reference variable (links directly to your PostgreSQL plugin) |
| `JWT_SECRET` | `generate-a-strong-random-32-char-key` | Secret key used to sign session tokens |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `3000` | Railway injects this automatically |

> [!TIP]
> Using Railway's reference syntax `${{Postgres.DATABASE_URL}}` guarantees that if your database credentials ever rotate, your web app updates automatically without downtime!

---

### Step 5: Database Migration & Automated Seeding
The application's startup command automatically runs:
```bash
npx prisma db push && npx tsx prisma/seed.ts && npx tsx server.ts
```
This guarantees that on your first deployment:
- All database tables (`User`, `Chat`, `Message`, `Reactions`, `Broadcasts`) are created automatically.
- Pre-seeded test accounts (`admin`, `alice`, `bob`, `charlie`) and sample chats are populated immediately!

---

### Step 6: Generate Public Domain & Test
1. In your web service settings, go to the **Networking** section.
2. Click **"Generate Domain"** (e.g. `whatsapp-clone-production.up.railway.app`).
3. Open your generated domain in a browser.
4. Log in using any of the 1-click test accounts or register a new one!

---

## 💻 Local Development Setup

### 1. Start Local PostgreSQL Database
If you have Docker installed, you can start a local PostgreSQL container in 1 command:
```bash
docker compose up -d
```
*(Or provide your own PostgreSQL connection string from Supabase, Neon, or local Postgres in `.env`)*

### 2. Push Schema & Seed
```bash
npx prisma db push
npm run prisma:seed
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Accounts

| Role | Username | Phone Number | Password | Capabilities |
|---|---|---|---|---|
| **Admin** | `admin` | `+10000000000` | `admin123` | Full access to `/admin` dashboard, user moderation (ban/unban/role toggle), real-time global broadcast |
| **User** | `alice` | `+10000000001` | `password123` | Direct messaging with Bob, Dev Team group member |
| **User** | `bob` | `+10000000002` | `password123` | Direct messaging with Alice, Dev Team group member |
| **User** | `charlie` | `+10000000003` | `password123` | Dev Team group member |
