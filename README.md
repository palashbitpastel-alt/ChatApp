# WhatsApp Web Full-Stack Clone (Next.js + Socket.io + PostgreSQL)

A feature-complete WhatsApp Web clone built with **Next.js 14 (App Router)**, **Socket.io** real-time WebSockets, **Prisma ORM**, and **PostgreSQL**, styled with authentic WhatsApp Web dark theme.

Designed and pre-configured for seamless 1-click deployment on **Railway**.

---

## 🌟 Key Features

### 💬 Real-Time Messaging (Socket.io)
- **1-on-1 Direct Messaging**: Private conversations with real-time socket delivery.
- **Group Chats**: Create group chats with custom subject and multiple participants.
- **Online / Offline Presence**: Live green presence indicator and "last seen" timestamps.
- **Live Typing Status**: Real-time "*typing...*" indicator in header and chat list.
- **Read Receipts**:
  - Single gray tick (✓) = Message Sent.
  - Double gray ticks (✓✓) = Message Delivered.
  - Double blue ticks (✓✓) = Message Read.
- **Emoji Reactions**: Hover over any message to react with emojis (👍, ❤️, 😂, 😮, 😢, 🙏).
- **Media Attachments**: Send photos with image preview and voice note audio simulation.

### 🛡️ Admin Dashboard (`/admin`)
- **Real-Time Analytics**: Total registered users, active online WebSocket sessions, total messages sent, and group statistics.
- **User Moderation**: View all users, search by phone or username, ban/unban bad actors, promote/demote administrator roles, or delete users.
- **Real-Time Global Broadcast**: Compose system announcements that instantly trigger a live alert banner across all connected users' screens via WebSocket.
- **Server Health & Telemetry**: Monitor uptime, database connection status, and deployment runtime.

### 🎨 Authentic WhatsApp Web Interface
- WhatsApp color tokens (`#00a884`, `#111b21`, `#202c33`, `#005c4b`).
- Authentic WhatsApp doodle wallpaper background.
- Tailored message bubbles (outgoing green, incoming dark gray).
- Filter chats by **All**, **Unread**, or **Groups**.
- Profile drawer with avatar, username, phone, and customizable status message.

---

## 🏗️ Architecture

```
ChatApp_Clone/
├── prisma/
│   ├── schema.prisma         # PostgreSQL data models (User, Chat, Message, Reactions, Broadcasts)
│   └── seed.ts               # Pre-seeded test accounts & initial chats
├── src/
│   ├── app/
│   │   ├── admin/            # Admin Dashboard (Overview, Users, Broadcasts)
│   │   ├── api/              # Next.js API Routes (Auth, Chats, Messages, Admin, Health)
│   │   ├── login/            # WhatsApp Web Login & Register with 1-click test accounts
│   │   ├── globals.css       # Custom styles, scrollbars, and WhatsApp chat wallpapers
│   │   ├── layout.tsx        # HTML root layout
│   │   └── page.tsx          # Main WhatsApp Web application
│   ├── components/
│   │   └── chat/             # Sidebar, ChatWindow, MessageBubble, ChatInput, Modals
│   ├── lib/
│   │   ├── auth.ts           # JWT authentication, bcrypt password hashing, session cookies
│   │   ├── prisma.ts         # PrismaClient singleton instance
│   │   ├── socket.tsx        # Client-side Socket.io Provider & Context hook
│   │   └── utils.ts          # Helper utilities & date formatters
│   └── types/                # TypeScript interface declarations & socket payloads
├── server.ts                 # Unified Node server running Next.js + Socket.io
├── Dockerfile                # Multi-stage production container
├── railway.json              # Railway platform build & deploy configuration
├── docker-compose.yml        # 1-click local PostgreSQL container
└── RAILWAY_DEPLOYMENT_GUIDE.md # Complete deployment walkthrough
```

---

## 🚀 Quick Start (Local)

### 1. Start Local PostgreSQL Database
```bash
docker compose up -d
```
*(Or specify your PostgreSQL connection string in `.env`)*

### 2. Push Database Schema & Seed Demo Data
```bash
npx prisma db push
npm run prisma:seed
```

### 3. Start Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000).

---

## 🔑 Demo Accounts (Pre-Seeded)

| Account | Username | Phone | Password | Role | Access |
|---|---|---|---|---|---|
| **Admin** | `admin` | `+10000000000` | `admin123` | `ADMIN` | WhatsApp Web + Full `/admin` Dashboard |
| **Alice** | `alice` | `+10000000001` | `password123` | `USER` | WhatsApp Web Chat |
| **Bob** | `bob` | `+10000000002` | `password123` | `USER` | WhatsApp Web Chat |
| **Charlie** | `charlie` | `+10000000003` | `password123` | `USER` | WhatsApp Web Chat |

---

## 🚂 Railway Deployment

Detailed instructions with screenshots and environment variable bindings are available in [RAILWAY_DEPLOYMENT_GUIDE.md](file:///C:/Users/palas/Desktop/ChatApp_Clone/RAILWAY_DEPLOYMENT_GUIDE.md).
