import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";
import { prisma } from "./src/lib/prisma";
import { COOKIE_NAME, verifyToken } from "./src/lib/jwt";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

if (!dev && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET must be set in production (anyone could forge login tokens otherwise).");
  process.exit(1);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store mapping of userId -> Set of socketIds
const userSockets = new Map<string, Set<string>>();

type AuthedSocket = Socket & { data: { userId: string; username: string } };

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

async function isParticipant(chatId: string, userId: string): Promise<boolean> {
  if (!chatId) return false;
  const participant = await prisma.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { id: true },
  });
  return !!participant;
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || "", true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket/io",
    // Client is served from the same origin, so no cross-origin access is needed.
    cors: dev ? { origin: true, credentials: true } : undefined,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Make io globally available for API routes (like Admin Broadcast)
  (global as unknown as { io: SocketIOServer }).io = io;

  // Authenticate every connection with the same httpOnly session cookie used by the API.
  io.use(async (socket, nextFn) => {
    try {
      const token =
        readCookie(socket.handshake.headers.cookie, COOKIE_NAME) ||
        (socket.handshake.auth?.token as string | undefined) ||
        null;
      const payload = token ? verifyToken(token) : null;
      if (!payload) return nextFn(new Error("unauthorized"));

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, username: true, isBanned: true },
      });
      if (!user || user.isBanned) return nextFn(new Error("unauthorized"));

      socket.data.userId = user.id;
      socket.data.username = user.username;
      nextFn();
    } catch (err) {
      console.error("Socket auth error:", err);
      nextFn(new Error("unauthorized"));
    }
  });

  io.on("connection", async (rawSocket) => {
    const socket = rawSocket as AuthedSocket;
    const { userId, username } = socket.data;

    // 1. Join personal room + every chat room the user belongs to.
    // Done server-side on each (re)connect so rooms survive reconnects and redeploys.
    socket.join(`user:${userId}`);
    try {
      const memberships = await prisma.chatParticipant.findMany({
        where: { userId },
        select: { chatId: true },
      });
      for (const m of memberships) socket.join(`chat:${m.chatId}`);
    } catch (err) {
      console.error("Error joining chat rooms:", err);
    }

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    const userSocketsSet = userSockets.get(userId)!;
    userSocketsSet.add(socket.id);

    // If user just came online
    if (userSocketsSet.size === 1) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true },
        });

        io.emit("user:presence", {
          userId,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error updating online status:", err);
      }
    }

    // Kept for backwards compatibility; identity now comes from the cookie.
    socket.on("auth:identify", () => {});

    // 2. Chat room management (e.g. a chat created after connecting)
    socket.on("chat:join", async (chatId: string) => {
      try {
        if (await isParticipant(chatId, userId)) {
          socket.join(`chat:${chatId}`);
        }
      } catch (err) {
        console.error("Error handling chat:join:", err);
      }
    });

    // Rooms are membership-based, so leaving the open chat view keeps the room
    // (the sidebar still needs its events).
    socket.on("chat:leave", () => {});

    // 3. Send message
    socket.on(
      "message:send",
      async (data: {
        chatId: string;
        content: string;
        type?: "TEXT" | "IMAGE" | "AUDIO" | "FILE";
        mediaUrl?: string;
      }) => {
        try {
          const { chatId, content, type = "TEXT", mediaUrl } = data || ({} as typeof data);
          if (!chatId || (!content && !mediaUrl)) return;
          if (!(await isParticipant(chatId, userId))) return;

          // Create message in database
          const message = await prisma.message.create({
            data: {
              chatId,
              senderId: userId,
              content: content || "",
              type,
              mediaUrl: mediaUrl || null,
              status: "SENT",
            },
            include: {
              sender: {
                select: {
                  id: true,
                  phone: true,
                  username: true,
                  avatarUrl: true,
                  statusMessage: true,
                  role: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
              reactions: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                    },
                  },
                },
              },
            },
          });

          // Update chat timestamp
          await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
          });

          // Single emit to the chat room + every participant's personal room.
          // Socket.io de-duplicates, so each socket receives the message exactly once,
          // including participants whose sockets haven't joined the chat room yet (new chats).
          const participants = await prisma.chatParticipant.findMany({
            where: { chatId },
            select: { userId: true },
          });
          const rooms = [`chat:${chatId}`, ...participants.map((p) => `user:${p.userId}`)];
          io.to(rooms).emit("message:new", message);
        } catch (err) {
          console.error("Error handling message:send:", err);
        }
      }
    );

    // 4. Mark message as read
    socket.on("message:read", async (data: { messageId: string; chatId: string }) => {
      try {
        const { messageId, chatId } = data || ({} as typeof data);
        if (!messageId || !chatId) return;
        if (!(await isParticipant(chatId, userId))) return;

        // Only the recipient can mark someone else's message as read
        const result = await prisma.message.updateMany({
          where: { id: messageId, chatId, senderId: { not: userId } },
          data: { status: "READ" },
        });
        if (result.count === 0) return;

        io.to(`chat:${chatId}`).emit("message:status", {
          messageId,
          chatId,
          status: "READ",
        });
      } catch (err) {
        console.error("Error handling message:read:", err);
      }
    });

    // 5. Message reaction
    socket.on(
      "message:react",
      async (data: { messageId: string; chatId: string; emoji: string }) => {
        try {
          const { messageId, chatId, emoji } = data || ({} as typeof data);
          if (!messageId || !chatId || !emoji) return;
          if (!(await isParticipant(chatId, userId))) return;

          const target = await prisma.message.findFirst({
            where: { id: messageId, chatId },
            select: { id: true },
          });
          if (!target) return;

          // Toggle reaction: if exists with same emoji, remove it; else upsert
          const existing = await prisma.messageReaction.findUnique({
            where: {
              messageId_userId: {
                messageId,
                userId,
              },
            },
          });

          if (existing && existing.emoji === emoji) {
            await prisma.messageReaction.delete({
              where: { id: existing.id },
            });
            io.to(`chat:${chatId}`).emit("message:reaction:removed", {
              messageId,
              chatId,
              userId,
            });
          } else {
            const reaction = await prisma.messageReaction.upsert({
              where: {
                messageId_userId: {
                  messageId,
                  userId,
                },
              },
              update: { emoji },
              create: {
                messageId,
                userId,
                emoji,
              },
              include: {
                user: {
                  select: { id: true, username: true },
                },
              },
            });

            io.to(`chat:${chatId}`).emit("message:reaction", {
              messageId,
              chatId,
              reaction,
            });
          }
        } catch (err) {
          console.error("Error handling message:react:", err);
        }
      }
    );

    // 6. Typing indicators (only relayed to rooms this socket is actually in)
    const relayTyping = (chatId: string, isTyping: boolean) => {
      if (!chatId || !socket.rooms.has(`chat:${chatId}`)) return;
      socket.to(`chat:${chatId}`).emit("typing:status", {
        chatId,
        userId,
        username,
        isTyping,
      });
    };
    socket.on("typing:start", (data: { chatId: string }) => relayTyping(data?.chatId, true));
    socket.on("typing:stop", (data: { chatId: string }) => relayTyping(data?.chatId, false));

    // 7. Disconnection
    socket.on("disconnect", async () => {
      const sockets = userSockets.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        userSockets.delete(userId);
        try {
          const now = new Date();
          await prisma.user.update({
            where: { id: userId },
            data: {
              isOnline: false,
              lastSeen: now,
            },
          });

          io.emit("user:presence", {
            userId,
            isOnline: false,
            lastSeen: now.toISOString(),
          });
        } catch (err) {
          console.error("Error handling user offline status:", err);
        }
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> 🚀 ChatApp server ready on http://${hostname}:${port}`);
    console.log(`> ⚡ Socket.io listening on path: /api/socket/io`);
    console.log(`> 🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // Railway sends SIGTERM on redeploy: close sockets cleanly so clients reconnect to the new instance.
  const shutdown = async (signal: string) => {
    console.log(`> ${signal} received, shutting down...`);
    io.close();
    httpServer.close();
    try {
      await prisma.user.updateMany({
        where: { id: { in: Array.from(userSockets.keys()) } },
        data: { isOnline: false, lastSeen: new Date() },
      });
    } catch {
      // ignore
    }
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
});
