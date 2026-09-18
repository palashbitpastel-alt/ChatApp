import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "./src/lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store mapping of userId -> Set of socketIds
const userSockets = new Map<string, Set<string>>();
// Store mapping of socketId -> userId
const socketUser = new Map<string, string>();

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
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Make io globally available for API routes (like Admin Broadcast)
  (global as unknown as { io: SocketIOServer }).io = io;

  io.on("connection", (socket) => {
    // 1. Identify and authenticate user connection
    socket.on("auth:identify", async (userId: string) => {
      if (!userId) return;

      socketUser.set(socket.id, userId);

      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      const userSocketsSet = userSockets.get(userId)!;
      userSocketsSet.add(socket.id);

      // Join user's personal notification room
      socket.join(`user:${userId}`);

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
    });

    // 2. Chat room management
    socket.on("chat:join", (chatId: string) => {
      if (chatId) {
        socket.join(`chat:${chatId}`);
      }
    });

    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
      }
    });

    // 3. Send message
    socket.on(
      "message:send",
      async (data: {
        chatId: string;
        senderId: string;
        content: string;
        type?: "TEXT" | "IMAGE" | "AUDIO" | "FILE";
        mediaUrl?: string;
      }) => {
        try {
          const { chatId, senderId, content, type = "TEXT", mediaUrl } = data;
          if (!chatId || !senderId || (!content && !mediaUrl)) return;

          // Create message in database
          const message = await prisma.message.create({
            data: {
              chatId,
              senderId,
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

          // Broadcast to chat room
          io.to(`chat:${chatId}`).emit("message:new", message);

          // Notify all participants so their sidebar preview updates
          const participants = await prisma.chatParticipant.findMany({
            where: { chatId },
            select: { userId: true },
          });

          for (const participant of participants) {
            io.to(`user:${participant.userId}`).emit("message:new", message);
          }
        } catch (err) {
          console.error("Error handling message:send:", err);
        }
      }
    );

    // 4. Mark message as read
    socket.on("message:read", async (data: { messageId: string; chatId: string }) => {
      try {
        const { messageId, chatId } = data;
        if (!messageId || !chatId) return;

        await prisma.message.update({
          where: { id: messageId },
          data: { status: "READ" },
        });

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
      async (data: { messageId: string; chatId: string; userId: string; emoji: string }) => {
        try {
          const { messageId, chatId, userId, emoji } = data;
          if (!messageId || !chatId || !userId || !emoji) return;

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

    // 6. Typing indicators
    socket.on(
      "typing:start",
      (data: { chatId: string; userId: string; username: string }) => {
        socket.to(`chat:${data.chatId}`).emit("typing:status", {
          chatId: data.chatId,
          userId: data.userId,
          username: data.username,
          isTyping: true,
        });
      }
    );

    socket.on(
      "typing:stop",
      (data: { chatId: string; userId: string; username: string }) => {
        socket.to(`chat:${data.chatId}`).emit("typing:status", {
          chatId: data.chatId,
          userId: data.userId,
          username: data.username,
          isTyping: false,
        });
      }
    );

    // 7. Disconnection
    socket.on("disconnect", async () => {
      const userId = socketUser.get(socket.id);
      socketUser.delete(socket.id);

      if (userId && userSockets.has(userId)) {
        const sockets = userSockets.get(userId)!;
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
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> 🚀 WhatsApp Clone Server ready on http://${hostname}:${port}`);
    console.log(`> ⚡ Socket.io listening on path: /api/socket/io`);
    console.log(`> 🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });
});
