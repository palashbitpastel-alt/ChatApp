import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
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
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Format chat items and calculate unread counts
    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = chat.messages[0] || null;

        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: user.id },
            status: { not: "READ" },
          },
        });

        return {
          id: chat.id,
          isGroup: chat.isGroup,
          name: chat.name,
          avatarUrl: chat.avatarUrl,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          participants: chat.participants,
          lastMessage,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error("Fetch chats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isGroup, recipientId, name, memberIds, avatarUrl } = await req.json();

    if (isGroup) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Group name is required" }, { status: 400 });
      }

      const allMemberIds = Array.from(new Set([user.id, ...(memberIds || [])]));

      const newGroupChat = await prisma.chat.create({
        data: {
          isGroup: true,
          name: name.trim(),
          avatarUrl:
            avatarUrl ||
            `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`,
          participants: {
            create: allMemberIds.map((mId) => ({
              userId: mId,
              role: mId === user.id ? "ADMIN" : "MEMBER",
            })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
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
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return NextResponse.json({
        chat: {
          ...newGroupChat,
          lastMessage: null,
          unreadCount: 0,
        },
      });
    } else {
      if (!recipientId) {
        return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
      }

      if (recipientId === user.id) {
        return NextResponse.json({ error: "Cannot create chat with yourself" }, { status: 400 });
      }

      // Check if 1-on-1 chat already exists between user and recipient
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: user.id } } },
            { participants: { some: { userId: recipientId } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
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
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (existingChat) {
        return NextResponse.json({
          chat: {
            ...existingChat,
            lastMessage: existingChat.messages[0] || null,
            unreadCount: 0,
          },
        });
      }

      // Create new 1-on-1 chat
      const newChat = await prisma.chat.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: user.id, role: "MEMBER" },
              { userId: recipientId, role: "MEMBER" },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
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
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return NextResponse.json({
        chat: {
          ...newChat,
          lastMessage: null,
          unreadCount: 0,
        },
      });
    }
  } catch (error) {
    console.error("Create chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
